package org.springframework.samples.smartcheckin.formation;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.settings.OneDriveService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@SuppressWarnings("null")
@WebMvcTest(controllers = FormationRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class FormationRestControllerTests {

	private static final String BASE_URL = "/api/v1/formations";

	@MockitoBean
	private FormationService formationService;

	@MockitoBean
	private UserService userService;

	@MockitoBean
	private SimpMessagingTemplate messagingTemplate;

	@MockitoBean
	private OneDriveService oneDriveService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private MockMvc mockMvc;

	private Formation formation;
	private User user;

	@BeforeEach
	void setUp() {
		formation = new Formation();
		formation.setId(1);
		formation.setName("Java 101");
		formation.setDescription("Intro to Java");

		user = new User();
		user.setId(10);
		user.setPersonalCode("1234");
	}

	@Test
	@WithMockUser
	void testGetAllFormations() throws Exception {
		when(formationService.findAll()).thenReturn(List.of(formation));

		mockMvc.perform(get(BASE_URL)).andExpect(status().isOk());
	}

	@Test
	@WithMockUser
	void testGetFormationByIdFound() throws Exception {
		when(formationService.findById(1)).thenReturn(Optional.of(formation));

		mockMvc.perform(get(BASE_URL + "/1")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser
	void testGetFormationByIdNotFound() throws Exception {
		when(formationService.findById(1)).thenReturn(Optional.empty());

		mockMvc.perform(get(BASE_URL + "/1")).andExpect(status().isNotFound());
	}

	@Test
	@WithMockUser
	void testRegisterAttendanceSuccess() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.registerAttendance(eq(1), anyString())).thenReturn(formation);

		mockMvc.perform(post(BASE_URL + "/1/attend").with(csrf())).andExpect(status().isOk());
	}

	@Test
	@WithMockUser
	void testCheckoutAttendanceSuccess() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.checkoutAttendance(1, "1234", "sig")).thenReturn(formation);

		FormationCheckoutRequest req = new FormationCheckoutRequest();
		req.setSignature("sig");

		mockMvc.perform(post(BASE_URL + "/1/checkout").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testAddAttendeeSuccess() throws Exception {
		mockMvc.perform(post(BASE_URL + "/1/attendances").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("userId", 10)))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testRemoveAttendeeSuccess() throws Exception {
		mockMvc.perform(delete(BASE_URL + "/1/attendances/10").with(csrf())).andExpect(status().isOk());
	}

	@Test
	@WithMockUser
	void testGetAllFormationsWithSearch() throws Exception {
		when(formationService.findAll()).thenReturn(List.of(formation));

		mockMvc.perform(get(BASE_URL).param("search", "Java")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testCreateFormationWithFiles() throws Exception {
		FormationRequest req = new FormationRequest();
		req.setName("Spring Security 101");
		req.setDescription("Security Course");
		req.setFormationDate(java.time.LocalDateTime.now());

		MockMultipartFile jsonPart = new MockMultipartFile(
				"formation", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));
		MockMultipartFile filePart = new MockMultipartFile(
				"files", "doc.pdf", MediaType.APPLICATION_PDF_VALUE, "content".getBytes());

		when(oneDriveService.uploadFile(any(), anyString())).thenReturn("http://onedrive.link/doc.pdf");
		when(formationService.saveFormation(any(Formation.class))).thenReturn(formation);

		mockMvc.perform(MockMvcRequestBuilders.multipart(BASE_URL)
				.file(jsonPart).file(filePart).with(csrf()))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testUpdateFormationWithFiles() throws Exception {
		FormationRequest req = new FormationRequest();
		req.setName("Spring Security Updated");
		req.setDescription("Updated Course");
		req.setFormationDate(java.time.LocalDateTime.now());
		req.setExistingDocumentUrls(List.of());

		MockMultipartFile jsonPart = new MockMultipartFile(
				"formation", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));
		MockMultipartFile filePart = new MockMultipartFile(
				"files", "doc2.pdf", MediaType.APPLICATION_PDF_VALUE, "content2".getBytes());

		when(formationService.findById(1)).thenReturn(Optional.of(formation));
		when(oneDriveService.uploadFile(any(), anyString())).thenReturn("http://onedrive.link/doc2.pdf");
		when(formationService.updateFormation(any(Formation.class), eq(1))).thenReturn(formation);

		MockHttpServletRequestBuilder builder = 
				MockMvcRequestBuilders.multipart(BASE_URL + "/1")
				.file(jsonPart).file(filePart).with(csrf());
		builder.with(request -> { request.setMethod("PUT"); return request; });

		mockMvc.perform(builder).andExpect(status().isOk());
	}

	@Test
	@WithMockUser
	void testRegisterAttendanceWithPersonalCodeInBody() throws Exception {
		AttendRequest req = new AttendRequest();
		req.setPersonalCode("9999");
		when(formationService.registerAttendance(1, "9999")).thenReturn(formation);

		mockMvc.perform(post(BASE_URL + "/1/attend").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser
	void testRegisterAttendanceFailure() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.registerAttendance(eq(1), anyString())).thenThrow(new IllegalArgumentException("Already registered"));

		mockMvc.perform(post(BASE_URL + "/1/attend").with(csrf())).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser
	void testCheckoutAttendanceFailure() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);
		when(formationService.checkoutAttendance(1, "1234", "sig")).thenThrow(new IllegalArgumentException("Not registered"));

		FormationCheckoutRequest req = new FormationCheckoutRequest();
		req.setSignature("sig");

		mockMvc.perform(post(BASE_URL + "/1/checkout").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testAddAttendeeFailure() throws Exception {
		doThrow(new RuntimeException("User not found")).when(formationService).addAttendee(1, 99);

		mockMvc.perform(post(BASE_URL + "/1/attendances").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("userId", 99)))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testRemoveAttendeeFailure() throws Exception {
		doThrow(new RuntimeException("User not in formation")).when(formationService).removeAttendee(1, 99);

		mockMvc.perform(delete(BASE_URL + "/1/attendances/99").with(csrf())).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testUpdateFormationNotFound() throws Exception {
		FormationRequest req = new FormationRequest();
		req.setName("Spring Security Updated");
		req.setDescription("Updated Course");
		req.setFormationDate(java.time.LocalDateTime.now());

		MockMultipartFile jsonPart = new MockMultipartFile(
				"formation", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));

		when(formationService.findById(1)).thenReturn(Optional.empty());

		MockHttpServletRequestBuilder builder = 
				MockMvcRequestBuilders.multipart(BASE_URL + "/1")
				.file(jsonPart).with(csrf());
		builder.with(request -> { request.setMethod("PUT"); return request; });

		mockMvc.perform(builder).andExpect(status().isInternalServerError());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testDeleteFormationIllegalArgumentException() throws Exception {
		doThrow(new IllegalArgumentException("Formation locked")).when(formationService).deleteFormation(1);

		mockMvc.perform(delete(BASE_URL + "/1").with(csrf())).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testDeleteFormationGenericException() throws Exception {
		doThrow(new RuntimeException("Database error")).when(formationService).deleteFormation(1);

		mockMvc.perform(delete(BASE_URL + "/1").with(csrf())).andExpect(status().isInternalServerError());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testDeleteFormationSuccess() throws Exception {
		doNothing().when(formationService).deleteFormation(1);

		mockMvc.perform(delete(BASE_URL + "/1").with(csrf())).andExpect(status().isOk());
	}
}