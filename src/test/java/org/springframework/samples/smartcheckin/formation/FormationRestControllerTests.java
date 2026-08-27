package org.springframework.samples.smartcheckin.formation;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.ZoneId;
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
import org.springframework.samples.smartcheckin.notifications.PushNotificationSender;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.samples.smartcheckin.SmartcheckinApplication;
import org.springframework.test.context.ContextConfiguration;

import org.springframework.context.annotation.Import;

@SuppressWarnings({"null", "java:S6813"})
@WebMvcTest(controllers = FormationRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
@ContextConfiguration(classes = SmartcheckinApplication.class)
@Import(FormationCheckinFacade.class)
class FormationRestControllerTests {

    private static final String BASE_URL = "/api/v1/formations";
    private static final String JAVA_101 = "Java 101";
    private static final String INTRO_TO_JAVA = "Intro to Java";
    private static final String ATTEND_PATH = "/1/attend";
    private static final String SEARCH_PARAM = "search";
    private static final String SPRING_SECURITY_101 = "Spring Security 101";
    private static final String SECURITY_COURSE = "Security Course";
    private static final String FORMATION_PART = "formation";
    private static final String FILES_PART = "files";
    private static final String DOC_PDF = "doc.pdf";
    private static final String SPRING_SECURITY_UPDATED = "Spring Security Updated";
    private static final String UPDATED_COURSE = "Updated Course";
    private static final String FILE1_ONEDRIVE_URL = "file1.pdf||http://onedrive.link/file1.pdf||item123";

    @MockitoBean
    private FormationService formationService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private PushNotificationSender pushNotificationSender;

    @MockitoBean
    private CloudStorageAdapter cloudStorageAdapter;

    @MockitoBean
    private org.springframework.samples.smartcheckin.notification.NotificationContext notificationContext;

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
        formation.setName(JAVA_101);
        formation.setDescription(INTRO_TO_JAVA);
        formation.setStatus(FormationStatus.PUBLISHED);

        user = new User();
        user.setId(10);
        user.setPersonalCode("1234");
    }

    @Test
    @WithMockUser
    void testGetAllFormations() throws Exception {
        when(formationService.findAllVisible(anyBoolean())).thenReturn(List.of(formation));

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
        when(formationService.registerAttendance(eq(1), anyString(), any())).thenReturn(formation);

        mockMvc.perform(post(BASE_URL + ATTEND_PATH).with(csrf())).andExpect(status().isOk());
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

        mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "Java")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testCreateFormationWithFiles() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_101);
        req.setDescription(SECURITY_COURSE);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));
        MockMultipartFile filePart = new MockMultipartFile(
                FILES_PART, DOC_PDF, MediaType.APPLICATION_PDF_VALUE, "content".getBytes());

        when(cloudStorageAdapter.uploadFile(any(), anyString())).thenReturn("http://onedrive.link/doc.pdf");
        when(formationService.saveFormation(any(Formation.class))).thenReturn(formation);

        mockMvc.perform(MockMvcRequestBuilders.multipart(BASE_URL)
                .file(jsonPart).file(filePart).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testUpdateFormationWithFiles() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_UPDATED);
        req.setDescription(UPDATED_COURSE);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));
        req.setExistingDocumentUrls(List.of());

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));
        MockMultipartFile filePart = new MockMultipartFile(
                FILES_PART, "doc2.pdf", MediaType.APPLICATION_PDF_VALUE, "content2".getBytes());

        when(formationService.findById(1)).thenReturn(Optional.of(formation));
        when(cloudStorageAdapter.uploadFile(any(), anyString())).thenReturn("http://onedrive.link/doc2.pdf");
        when(formationService.updateFormation(any(Formation.class), eq(1))).thenReturn(formation);

        MockHttpServletRequestBuilder builder = 
                MockMvcRequestBuilders.multipart(BASE_URL + "/1")
                .file(jsonPart).file(filePart).with(csrf());
        builder.with(request -> { request.setMethod("PUT"); return request; });

        mockMvc.perform(builder).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testUpdateFormationRemovesFileTriggersOneDriveDelete() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName(JAVA_101);
        existing.setDescription(INTRO_TO_JAVA);
        existing.setLocation("BA VILLAFRANCA");
        existing.setTrainer("VICTOR PARDO");
        existing.getDocumentUrls().add(FILE1_ONEDRIVE_URL);
        existing.getDocumentUrls().add("file2.pdf||http://onedrive.link/file2.pdf||item456");

        FormationRequest req = new FormationRequest();
        req.setName("Java 101 Updated");
        req.setDescription(INTRO_TO_JAVA);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));
        req.setExistingDocumentUrls(List.of(FILE1_ONEDRIVE_URL));

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));

        when(formationService.findById(1)).thenReturn(Optional.of(existing));
        when(formationService.updateFormation(any(Formation.class), eq(1))).thenReturn(existing);

        MockHttpServletRequestBuilder builder = 
                MockMvcRequestBuilders.multipart(BASE_URL + "/1")
                .file(jsonPart).with(csrf());
        builder.with(request -> { request.setMethod("PUT"); return request; });

        mockMvc.perform(builder).andExpect(status().isOk());

        verify(cloudStorageAdapter, times(1)).deleteFile("file2.pdf||http://onedrive.link/file2.pdf||item456");
        verify(cloudStorageAdapter, never()).deleteFile(FILE1_ONEDRIVE_URL);
    }

    @Test
    @WithMockUser
    void testRegisterAttendanceWithPersonalCodeInBody() throws Exception {
        AttendRequest req = new AttendRequest();
        req.setPersonalCode("9999");
        when(formationService.registerAttendance(eq(1), eq("9999"), any())).thenReturn(formation);

        mockMvc.perform(post(BASE_URL + ATTEND_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void testRegisterAttendanceFailure() throws Exception {
        when(userService.findCurrentUser()).thenReturn(user);
        when(formationService.registerAttendance(eq(1), anyString(), any())).thenThrow(new IllegalArgumentException("Already registered"));

        mockMvc.perform(post(BASE_URL + ATTEND_PATH).with(csrf())).andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void testCheckoutAttendanceFailure() throws Exception {
        when(userService.findCurrentUser()).thenReturn(user);
        when(formationService.checkoutAttendance(eq(1), eq("1234"), eq("sig"), any())).thenThrow(new IllegalArgumentException("Not registered"));

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
        req.setName(SPRING_SECURITY_UPDATED);
        req.setDescription(UPDATED_COURSE);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));

        when(formationService.findById(1)).thenReturn(Optional.empty());

        MockHttpServletRequestBuilder builder = 
                MockMvcRequestBuilders.multipart(BASE_URL + "/1")
                .file(jsonPart).with(csrf());
        builder.with(request -> { request.setMethod("PUT"); return request; });

        mockMvc.perform(builder).andExpect(status().isBadRequest());
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
    void testUpdateFormationRemovesFileOneDriveException() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName(JAVA_101);
        existing.setDescription(INTRO_TO_JAVA);
        existing.setLocation("BA VILLAFRANCA");
        existing.setTrainer("VICTOR PARDO");
        existing.getDocumentUrls().add(FILE1_ONEDRIVE_URL);

        FormationRequest req = new FormationRequest();
        req.setName("Java 101 Updated");
        req.setDescription(INTRO_TO_JAVA);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));
        req.setExistingDocumentUrls(List.of());

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));

        when(formationService.findById(1)).thenReturn(Optional.of(existing));
        when(formationService.updateFormation(any(Formation.class), eq(1))).thenReturn(existing);
        
        doThrow(new RuntimeException("Delete error")).when(cloudStorageAdapter).deleteFile(anyString());

        MockHttpServletRequestBuilder builder = 
                MockMvcRequestBuilders.multipart(BASE_URL + "/1")
                .file(jsonPart).with(csrf());
        builder.with(request -> { request.setMethod("PUT"); return request; });

        // It should catch the exception, log it, and continue, so it will still be OK.
        mockMvc.perform(builder).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testUpdateFormationUploadFileOneDriveException() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_UPDATED);
        req.setDescription(UPDATED_COURSE);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));
        req.setExistingDocumentUrls(List.of());

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));
        MockMultipartFile filePart = new MockMultipartFile(
                FILES_PART, "doc2.pdf", MediaType.APPLICATION_PDF_VALUE, "content2".getBytes());

        when(formationService.findById(1)).thenReturn(Optional.of(formation));
        when(cloudStorageAdapter.uploadFile(any(), anyString())).thenThrow(new RuntimeException("Upload error"));

        MockHttpServletRequestBuilder builder = 
                MockMvcRequestBuilders.multipart(BASE_URL + "/1")
                .file(jsonPart).file(filePart).with(csrf());
        builder.with(request -> { request.setMethod("PUT"); return request; });

        // Como la excepción ya no se traga, ahora la petición falla correctamente con código de error
        mockMvc.perform(builder).andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testCreateFormationEmptyFile() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_101);
        req.setDescription(SECURITY_COURSE);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));
        MockMultipartFile filePart = new MockMultipartFile(
                FILES_PART, DOC_PDF, MediaType.APPLICATION_PDF_VALUE, new byte[0]); // empty file

        when(formationService.saveFormation(any(Formation.class))).thenReturn(formation);

        mockMvc.perform(MockMvcRequestBuilders.multipart(BASE_URL)
                .file(jsonPart).file(filePart).with(csrf()))
                .andExpect(status().isOk());

        // Verify uploadFile is not called for empty file
        verify(cloudStorageAdapter, never()).uploadFile(any(), anyString());
    }
    
    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testCreateFormationUploadFileOneDriveException() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_101);
        req.setDescription(SECURITY_COURSE);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));
        MockMultipartFile filePart = new MockMultipartFile(
                FILES_PART, DOC_PDF, MediaType.APPLICATION_PDF_VALUE, "content".getBytes());

        when(cloudStorageAdapter.uploadFile(any(), anyString())).thenThrow(new RuntimeException("Upload error"));

        mockMvc.perform(MockMvcRequestBuilders.multipart(BASE_URL)
                .file(jsonPart).file(filePart).with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testDeleteFormationSuccess() throws Exception {
        doNothing().when(formationService).deleteFormation(1);

        mockMvc.perform(delete(BASE_URL + "/1").with(csrf())).andExpect(status().isOk());
    }

    // --- NUEVOS TESTS PARA COBERTURA DE CONDICIONES Y EXCEPCIONES ---

    @Test
    @WithMockUser
    void getAllFormationsWithSearchThoroughly() throws Exception {
        Formation f1 = new Formation(); f1.setName("MatchName"); f1.setDescription("Desc");
        Formation f2 = new Formation(); f2.setName(null); f2.setDescription("MatchDesc");
        Formation f3 = new Formation(); f3.setName("Other"); f3.setDescription(null);
        Formation f4 = new Formation(); f4.setName(null); f4.setDescription(null);

        when(formationService.findAllVisible(anyBoolean())).thenReturn(List.of(f1, f2, f3, f4));

        mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "match"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @WithMockUser
    void getAllFormationsWithBlankSearch() throws Exception {
        when(formationService.findAllVisible(anyBoolean())).thenReturn(List.of(formation));

        mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser
    void registerAttendanceWithNullRequest() throws Exception {
        when(userService.findCurrentUser()).thenReturn(user);
        when(formationService.registerAttendance(eq(1), eq("1234"), any())).thenReturn(formation);

        mockMvc.perform(post(BASE_URL + ATTEND_PATH).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void registerAttendanceWithNullPersonalCode() throws Exception {
        when(userService.findCurrentUser()).thenReturn(user);
        when(formationService.registerAttendance(eq(1), eq("1234"), any())).thenReturn(formation);

        AttendRequest req = new AttendRequest();
        req.setPersonalCode(null);

        mockMvc.perform(post(BASE_URL + ATTEND_PATH).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void registerAttendanceWithBlankPersonalCode() throws Exception {
        when(userService.findCurrentUser()).thenReturn(user);
        when(formationService.registerAttendance(1, "1234")).thenReturn(formation);

        AttendRequest req = new AttendRequest();
        req.setPersonalCode("   ");

        mockMvc.perform(post(BASE_URL + ATTEND_PATH).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void createFormationWithNullFilesList() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_101);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));

        when(formationService.saveFormation(any(Formation.class))).thenReturn(formation);

        mockMvc.perform(MockMvcRequestBuilders.multipart(BASE_URL)
                .file(jsonPart).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void updateFormationWithNullExistingUrlsAndNullFiles() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_UPDATED);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));
        req.setExistingDocumentUrls(null); 

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));

        when(formationService.findById(1)).thenReturn(Optional.of(formation));
        when(formationService.updateFormation(any(Formation.class), eq(1))).thenReturn(formation);

        MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.multipart(BASE_URL + "/1").file(jsonPart).with(csrf());
        builder.with(request -> { request.setMethod("PUT"); return request; });

        mockMvc.perform(builder).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void notifyFormationsUpdateException() throws Exception {
        doThrow(new RuntimeException("Simulated messaging error")).when(messagingTemplate).convertAndSend(anyString(), anyString());
        doNothing().when(formationService).deleteFormation(1);

        mockMvc.perform(delete(BASE_URL + "/1").with(csrf())).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void notifyFormationsUpdateWithNullFormationId() throws Exception {
        Formation nullIdFormation = new Formation();
        nullIdFormation.setId(null);
        nullIdFormation.setName("No ID Formation");

        FormationRequest req = new FormationRequest();
        req.setName(SPRING_SECURITY_101);
        req.setLocation("BA VILLAFRANCA");
        req.setTrainer("VICTOR PARDO");
        req.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));

        MockMultipartFile jsonPart = new MockMultipartFile(
                FORMATION_PART, "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(req));

        when(formationService.saveFormation(any(Formation.class))).thenReturn(nullIdFormation);

        mockMvc.perform(MockMvcRequestBuilders.multipart(BASE_URL)
                .file(jsonPart).with(csrf()))
                .andExpect(status().isOk());
    }

	@Test
    @WithMockUser(authorities = {"ADMIN"})
    void notifyFormationsUpdateExceptionWithNonNullId() throws Exception {
        doNothing().when(messagingTemplate).convertAndSend(eq("/topic/formations"), anyString());
        doThrow(new RuntimeException("Simulated specific messaging error")).when(messagingTemplate).convertAndSend(eq("/topic/formations/1"), anyString());
        
        doNothing().when(formationService).deleteFormation(1);

        mockMvc.perform(delete(BASE_URL + "/1").with(csrf())).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testCloseFormationSuccess() throws Exception {
        CloseFormationRequest req = new CloseFormationRequest();
        req.setSignature("data:image/png;base64,sample");
        req.setObservations("Sin incidencias");
        req.setTrainerName("VICTOR PARDO");
        req.setLocation("BA VILLAFRANCA");

        Formation closed = new Formation();
        closed.setId(1);
        closed.setName("Formación Picking");
        closed.setIsClosed(true);
        closed.setObservations("Sin incidencias");
        closed.setTrainer("VICTOR PARDO");
        closed.setLocation("BA VILLAFRANCA");

        when(formationService.closeFormation(eq(1), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(closed);

        mockMvc.perform(post(BASE_URL + "/1/close")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.isClosed").value(true))
                .andExpect(jsonPath("$.observations").value("Sin incidencias"))
                .andExpect(jsonPath("$.trainer").value("VICTOR PARDO"))
                .andExpect(jsonPath("$.location").value("BA VILLAFRANCA"));
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    void testCloseFormationIllegalStateReturnsBadRequest() throws Exception {
        CloseFormationRequest req = new CloseFormationRequest();
        when(formationService.closeFormation(anyInt(), any(), any(), any(), any()))
            .thenThrow(new IllegalStateException("Todos los asistentes deben completar checkout"));

        mockMvc.perform(post(BASE_URL + "/1/close")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Todos los asistentes deben completar checkout"));
    }
}
