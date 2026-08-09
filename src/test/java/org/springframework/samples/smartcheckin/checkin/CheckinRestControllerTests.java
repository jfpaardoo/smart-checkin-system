package org.springframework.samples.smartcheckin.checkin;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationService;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@SuppressWarnings({"null", "java:S1313"})
@WebMvcTest(controllers = CheckinRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class CheckinRestControllerTests {

	private static final String BASE_URL = "/api/v1/checkins";
	private static final String QR_FICHAJE_URL = "/qr-fichaje";
	private static final String DEFAULT_QR_TOKEN = "654321";
	private static final String TOKEN_123456 = "123456";
	private static final String TOKEN_000000 = "000000";
	private static final String JSON_PATH_CHECKIN_ID = "$.checkin.id";
	private static final String WRONG_TOKEN_VAL = "WRONG_TOKEN";

	@MockitoBean
	private CheckinService checkInService;

	@MockitoBean
	private UserService userService;

	@MockitoBean
	private TotpService totpService;

	@MockitoBean
	private FormationService formationService;

	@MockitoBean
	private SimpMessagingTemplate messagingTemplate;

	@MockitoBean
	private SignatureStorageService signatureStorageService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private MockMvc mockMvc;

	private User user;
	private Checkin checkin;

	@BeforeEach
	void setUp() {
		user = new User();
		user.setId(1);
		user.setUsername("user1");
		user.setIsWorking(false);

		checkin = new Checkin();
		checkin.setId(10);
		checkin.setUser(user);
		checkin.setCheckInType(CheckinType.ENTRADA);
		checkin.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
	}

	@Test
	@WithMockUser
	void getMyHistory() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(checkInService.findByUserId(1)).thenReturn(List.of(checkin));

		mockMvc.perform(get(BASE_URL + "/my-history")).andExpect(status().isOk())
				.andExpect(jsonPath("$.size()").value(1));
	}

	@Test
	@WithMockUser
	void checkIn() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(checkInService.performCheckIn(user, CheckinType.ENTRADA)).thenReturn(checkin);

		CheckinRequest req = new CheckinRequest();
		req.setCheckInType(CheckinType.ENTRADA);

		mockMvc.perform(post(BASE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated());
	}

	@Test
	@WithMockUser
	void qrCheckinFormationFlow() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);

		Formation formation = new Formation();
		formation.setId(5);
		formation.setName("Course 5");
		when(formationService.findAll()).thenReturn(List.of(formation));
		when(totpService.verifyToken(eq(TOKEN_123456), any())).thenReturn(true);
		when(formationService.registerAttendance(5, user)).thenReturn(formation);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(TOKEN_123456);
		req.setFormationId(5L);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.formationId").value(5));
	}

	@Test
	@WithMockUser
	void qrCheckinFormationFlowInvalidLocation() throws Exception {
		Formation formation = new Formation();
		formation.setId(100);
		formation.setName("Spring Course");

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(TOKEN_123456);
		req.setFormationId(100L);
		req.setUserLat(37.3891);
		req.setUserLng(-5.9845);
		req.setAdminLat(37.4000);
		req.setAdminLng(-6.0000);

    	when(userService.findCurrentUser()).thenReturn(user);
    	when(formationService.findAll()).thenReturn(List.of(formation));
    	when(totpService.verifyToken(eq(TOKEN_123456), any())).thenReturn(true);

    	mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL)
            	.with(csrf())
            	.with(request -> {
                	request.setRemoteAddr("10.0.0.101");
                	return request;
            	})
            	.contentType(MediaType.APPLICATION_JSON)
            	.content(objectMapper.writeValueAsString(req)))
            	.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser
	void qrCheckinFormationFlowThrowsException() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);

		Formation formation = new Formation();
		formation.setId(5);
		formation.setName("Course 5");
		when(formationService.findAll()).thenReturn(List.of(formation));
		when(totpService.verifyToken(eq(TOKEN_123456), any())).thenReturn(true);
		when(formationService.registerAttendance(5, user)).thenThrow(new RuntimeException("Database error"));

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(TOKEN_123456);
		req.setFormationId(5L);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Error al registrar en formación: Database error"));
	}

	@Test
	@WithMockUser
	void qrCheckinProvidedFormationIdButInvalidToken() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);

		Formation formation = new Formation();
		formation.setId(5);
		when(formationService.findAll()).thenReturn(List.of(formation));

		when(totpService.verifyToken(TOKEN_000000, 5L)).thenReturn(false);
		when(totpService.verifyToken(TOKEN_000000)).thenReturn(false);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(TOKEN_000000);
		req.setFormationId(5L);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser
	void qrCheckinResolvesFormationFromList() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);

		Formation formation = new Formation();
		formation.setId(8);
		formation.setName("Iterated Course");
		when(formationService.findAll()).thenReturn(List.of(formation));

		when(totpService.verifyToken(TOKEN_123456, 8)).thenReturn(true);
		when(formationService.registerAttendance(8, user)).thenReturn(formation);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(TOKEN_123456);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.formationId").value(8));
	}

	@Test
	@WithMockUser
	void qrCheckinResolvesNoFormationFromList() throws Exception {
		user.setIsWorking(false);
		when(userService.findCurrentUser()).thenReturn(user);

		Formation formation = new Formation();
		formation.setId(9);
		when(formationService.findAll()).thenReturn(List.of(formation));

		when(totpService.verifyToken(DEFAULT_QR_TOKEN, 9)).thenReturn(false);
		when(totpService.verifyToken(DEFAULT_QR_TOKEN)).thenReturn(true);
		when(checkInService.performCheckIn(user, CheckinType.ENTRADA)).thenReturn(checkin);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(DEFAULT_QR_TOKEN);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated())
				.andExpect(jsonPath(JSON_PATH_CHECKIN_ID).value(10));
	}

	@Test
	@WithMockUser
	void qrCheckinGlobalFlowEntrada() throws Exception {
		user.setIsWorking(false);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken(DEFAULT_QR_TOKEN)).thenReturn(true);
		when(checkInService.performCheckIn(user, CheckinType.ENTRADA)).thenReturn(checkin);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(DEFAULT_QR_TOKEN);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL)
				.with(csrf())
				.with(request -> {
					request.setRemoteAddr("10.0.0.1");
					return request;
				}) // Burlar el RateLimit
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated())
				.andExpect(jsonPath(JSON_PATH_CHECKIN_ID).value(10));
	}

	@Test
	@WithMockUser
	void qrCheckinGlobalFlowValidLocation() throws Exception {
		user.setIsWorking(false);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken(DEFAULT_QR_TOKEN)).thenReturn(true);
		when(checkInService.performCheckIn(user, CheckinType.ENTRADA)).thenReturn(checkin);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(DEFAULT_QR_TOKEN);
		req.setUserLat(40.0);
		req.setUserLng(-3.0);
		req.setAdminLat(40.0);
		req.setAdminLng(-3.0);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated())
				.andExpect(jsonPath(JSON_PATH_CHECKIN_ID).value(10));
	}

	@Test
	@WithMockUser
	void qrCheckinGlobalFlowSalidaSuccess() throws Exception {
		user.setIsWorking(true);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken(DEFAULT_QR_TOKEN)).thenReturn(true);
		when(checkInService.performCheckIn(user, CheckinType.SALIDA)).thenReturn(checkin);
		when(signatureStorageService.saveSignature(anyString(), anyString())).thenReturn("test-signature.png");
		when(checkInService.save(any(Checkin.class))).thenReturn(checkin);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(DEFAULT_QR_TOKEN);
		req.setSignature("data:image/png;base64,sig");

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated());
	}

	@Test
	@WithMockUser
	void qrCheckinGlobalFlowSalidaEmptySignature() throws Exception {
		user.setIsWorking(true);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken(DEFAULT_QR_TOKEN)).thenReturn(true);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(DEFAULT_QR_TOKEN);
		req.setSignature("");

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isAccepted());
	}

	@Test
	@WithMockUser
	void qrCheckinInvalidLocation() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken(DEFAULT_QR_TOKEN)).thenReturn(true);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(DEFAULT_QR_TOKEN);
		req.setUserLat(0.0);
		req.setUserLng(0.0);
		req.setAdminLat(40.0);
		req.setAdminLng(40.0);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser
	void qrCheckinGlobalFlowSalidaMissingSignature() throws Exception {
		user.setIsWorking(true);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken(DEFAULT_QR_TOKEN)).thenReturn(true);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken(DEFAULT_QR_TOKEN);

		mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL)
				.with(csrf())
				.with(request -> {
					request.setRemoteAddr("10.0.0.2");
					return request;
				}) // Burlar el RateLimit
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isAccepted());
	}

	@Test
	@WithMockUser
	void testResolveFormationReturnsNullWhenFormationIdTokenInvalid() throws Exception {

    	Formation formation = new Formation();
    	formation.setId(100);

    	QrCheckinRequest req = new QrCheckinRequest();
    	req.setToken(TOKEN_123456); // exactamente 6 caracteres
    	req.setFormationId(100L);

    	when(userService.findCurrentUser()).thenReturn(user);
    	when(formationService.findAll()).thenReturn(List.of(formation));

    	// El token de formación es inválido
    	when(totpService.verifyToken(TOKEN_123456, 100L)).thenReturn(false);

    	// El token global también es inválido
    	when(totpService.verifyToken(TOKEN_123456)).thenReturn(false);

    	mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL)
            	.with(csrf())
            	.with(request -> {
                	request.setRemoteAddr("10.0.0.102");
                	return request;
            	})
            	.contentType(MediaType.APPLICATION_JSON)
            	.content(objectMapper.writeValueAsString(req)))
            	.andExpect(status().isUnauthorized())
            	.andExpect(jsonPath("$.message").value("Código inválido o expirado."));
	}

    @Test
    @WithMockUser
    void testResolveFormationReturnsNullWhenNoFormationMatchesToken() throws Exception {
    	Formation formation = new Formation();
    	formation.setId(300);

    	QrCheckinRequest req = new QrCheckinRequest();
    	req.setToken(WRONG_TOKEN_VAL);

    	when(userService.findCurrentUser()).thenReturn(user);
    	when(formationService.findAll()).thenReturn(List.of(formation));
    	when(totpService.verifyToken(WRONG_TOKEN_VAL, 300)).thenReturn(false);
    	when(totpService.verifyToken(WRONG_TOKEN_VAL)).thenReturn(false);

    	mockMvc.perform(post(BASE_URL + QR_FICHAJE_URL)
            	.with(csrf())
            	.with(request -> {
                	request.setRemoteAddr("10.0.0.103");
                	return request;
            	})
            	.contentType(MediaType.APPLICATION_JSON)
            	.content(objectMapper.writeValueAsString(req)))
            	.andExpect(status().isBadRequest());
	}
}