package org.springframework.samples.smartcheckin.checkin;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
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
import org.springframework.samples.smartcheckin.storage.LocalFileSystemService;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@SuppressWarnings("null")
@WebMvcTest(controllers = CheckinRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class CheckinRestControllerTests {

	private static final String BASE_URL = "/api/v1/checkins";

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
	private LocalFileSystemService localFileSystemService;

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
		checkin.setCheckInDate(LocalDateTime.now());
	}

	@Test
	@WithMockUser
	void testGetMyHistory() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(checkInService.findByUserId(1)).thenReturn(List.of(checkin));

		mockMvc.perform(get(BASE_URL + "/my-history")).andExpect(status().isOk())
				.andExpect(jsonPath("$.size()").value(1));
	}

	@Test
	@WithMockUser
	void testCheckIn() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(checkInService.performCheckIn(user, CheckinType.ENTRADA)).thenReturn(checkin);

		CheckinRequest req = new CheckinRequest();
		req.setCheckInType(CheckinType.ENTRADA);

		mockMvc.perform(post(BASE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated());
	}

	@Test
	@WithMockUser
	void testQrCheckinFormationFlow() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);

		Formation formation = new Formation();
		formation.setId(5);
		formation.setName("Course 5");
		when(formationService.findAll()).thenReturn(List.of(formation));
		when(totpService.verifyToken(eq("123456"), any())).thenReturn(true);
		when(formationService.registerAttendance(5, user)).thenReturn(formation);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken("123456");
		req.setFormationId(5L);

		mockMvc.perform(post(BASE_URL + "/qr-fichaje").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.formationId").value(5));
	}

	@Test
	@WithMockUser
	void testQrCheckinGlobalFlowEntrada() throws Exception {
		user.setIsWorking(false);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken("654321")).thenReturn(true);
		when(checkInService.performCheckIn(user, CheckinType.ENTRADA)).thenReturn(checkin);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken("654321");

		mockMvc.perform(post(BASE_URL + "/qr-fichaje").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.checkin.id").value(10));
	}

	@Test
	@WithMockUser
	void testQrCheckinGlobalFlowSalidaSuccess() throws Exception {
		user.setIsWorking(true);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken("654321")).thenReturn(true);
		when(checkInService.performCheckIn(user, CheckinType.SALIDA)).thenReturn(checkin);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken("654321");
		req.setSignature("data:image/png;base64,sig");

		mockMvc.perform(post(BASE_URL + "/qr-fichaje").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated());
	}

	@Test
	@WithMockUser
	void testQrCheckinGlobalFlowSalidaMissingSignature() throws Exception {
		user.setIsWorking(true);
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken("654321")).thenReturn(true);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken("654321");

		mockMvc.perform(post(BASE_URL + "/qr-fichaje").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isAccepted());
	}

	@Test
	@WithMockUser
	void testQrCheckinInvalidLocation() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken("654321")).thenReturn(true);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken("654321");
		req.setUserLat(0.0);
		req.setUserLng(0.0);
		req.setAdminLat(40.0);
		req.setAdminLng(40.0);

		mockMvc.perform(post(BASE_URL + "/qr-fichaje").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser
	void testQrCheckinInvalidToken() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.findAll()).thenReturn(List.of());
		when(totpService.verifyToken("000000")).thenReturn(false);

		QrCheckinRequest req = new QrCheckinRequest();
		req.setToken("000000");

		mockMvc.perform(post(BASE_URL + "/qr-fichaje").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isUnauthorized());
	}
}