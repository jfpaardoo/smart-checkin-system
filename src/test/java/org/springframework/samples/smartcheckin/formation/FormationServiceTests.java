package org.springframework.samples.smartcheckin.formation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.samples.smartcheckin.settings.OneDriveService;
import org.springframework.samples.smartcheckin.notification.NotificationContext;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.context.ApplicationEventPublisher;

@SuppressWarnings("null")
class FormationServiceTests {

    private FormationRepository formationRepository;
    private FormationAttendanceRepository attendanceRepository;
    private UserService userService;
    private OneDriveService oneDriveService;
    private SignatureStorageService signatureStorageService;
    private FormationService formationService;

    private static final String FORMATIONS_DIR = "formations";
    private static final String APP_PDF = "application/pdf";
    private static final String NEW_PDF = "new.pdf";
    private static final String NEW_ONEDRIVE_URL = "https://onedrive.live.com/new.pdf";

    @BeforeEach
    void setUp() {
        formationRepository = mock(FormationRepository.class);
        attendanceRepository = mock(FormationAttendanceRepository.class);
        userService = mock(UserService.class);
        oneDriveService = mock(OneDriveService.class);
        NotificationContext notificationContext = mock(NotificationContext.class);
        signatureStorageService = mock(SignatureStorageService.class);
        ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
        
        formationService = new FormationService(formationRepository, attendanceRepository, userService, oneDriveService, notificationContext, signatureStorageService, eventPublisher);
    }

    @Test
    void testSaveAndFind() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setName("Math");

        when(formationRepository.save(formation)).thenReturn(formation);
        when(formationRepository.findAll()).thenReturn(List.of(formation));
        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));

        assertEquals(formation, formationService.saveFormation(formation));
        assertEquals(1, formationService.findAll().size());
        assertTrue(formationService.findById(1).isPresent());
    }

    @Test
    void testRegisterAttendanceNew() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setAttendances(new ArrayList<>());

        User user = new User();
        user.setId(10);

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.empty());

        Formation res = formationService.registerAttendance(1, user);
        assertNotNull(res);
        assertTrue(user.getIsWorking());
        verify(userService, times(1)).saveUser(user);
    }

    @Test
    void testRegisterAttendanceByPersonalCode() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setAttendances(new ArrayList<>());

        User user = new User();
        user.setPersonalCode("1234");

        when(userService.findByPersonalCode("1234")).thenReturn(user);
        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.empty());

        Formation res = formationService.registerAttendance(1, "1234");
        assertNotNull(res);
        assertTrue(user.getIsWorking());
    }

    @Test
    void testCheckoutAttendance() {
        Formation formation = new Formation();
        formation.setId(1);

        User user = new User();
        user.setPersonalCode("1234");

        FormationAttendance att = new FormationAttendance();
        att.setFormation(formation);
        att.setUser(user);

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(userService.findByPersonalCode("1234")).thenReturn(user);
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.of(att));
        when(signatureStorageService.saveSignature(anyString(), anyString())).thenReturn("test-signature.png");

        Formation res = formationService.checkoutAttendance(1, "1234", "sig");
        assertNotNull(res);
        assertFalse(user.getIsWorking());
        assertEquals("test-signature.png", att.getSignature());
        assertNotNull(att.getCheckOutDate());
    }

    @Test
    void testAddAndRemoveAttendee() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setAttendances(new ArrayList<>());

        User user = new User();
        user.setId(10);

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(userService.findUser(10)).thenReturn(user);
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.empty());

        formationService.addAttendee(1, 10);
        verify(attendanceRepository, times(1)).save(any(FormationAttendance.class));

        FormationAttendance att = new FormationAttendance();
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.of(att));

        formationService.removeAttendee(1, 10);
        verify(attendanceRepository, times(1)).delete(att);
    }

    @Test
    void testDeleteFormationEmpty() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setAttendances(new ArrayList<>());

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));

        formationService.deleteFormation(1);
        verify(formationRepository, times(1)).delete(formation);
    }

    @Test
    void testUpdateFormationSuccess() {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old Name");

        Formation updated = new Formation();
        updated.setName("New Name");

        when(formationRepository.findById(1)).thenReturn(Optional.of(existing));
        when(formationRepository.save(existing)).thenReturn(existing);

        Formation res = formationService.updateFormation(updated, 1);
        assertEquals("New Name", res.getName());
    }

    @Test
    void testUpdateFormationNotFound() {
        Formation dummy = new Formation();
        when(formationRepository.findById(999)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> formationService.updateFormation(dummy, 999));
    }

    @Test
    void testDeleteFormationNotFound() {
        when(formationRepository.findById(999)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> formationService.deleteFormation(999));
    }

    @Test
    void testRemoveAttendeeNotFound() {
        when(formationRepository.findById(999)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> formationService.removeAttendee(999, 10));
    }

    @Test
    void testAddAttendeeNotFound() {
        when(formationRepository.findById(999)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> formationService.addAttendee(999, 10));
    }

    @Test
    void testCheckoutAttendanceFormationNotFound() {
        when(formationRepository.findById(999)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> formationService.checkoutAttendance(999, "1234", "sig"));
    }

    @Test
    void testCheckoutAttendanceUserNotRegistered() {
        Formation formation = new Formation();
        formation.setId(1);

        User user = new User();
        user.setPersonalCode("1234");

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(userService.findByPersonalCode("1234")).thenReturn(user);
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> formationService.checkoutAttendance(1, "1234", "sig"));
    }

    @Test
    void testDoRegisterAttendanceUserNotFound() {
        when(userService.findByPersonalCode("invalid")).thenReturn(null);
        assertThrows(IllegalArgumentException.class, () -> formationService.registerAttendance(1, "invalid"));
    }

    @Test
    void testDeleteFormationWithAttendeesException() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setAttendances(List.of(new FormationAttendance()));

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));

        assertThrows(IllegalArgumentException.class, () -> formationService.deleteFormation(1));
    }

    @Test
    void testRegisterAttendanceExistingNullCheckInDate() {
        Formation formation = new Formation();
        formation.setId(1);

        User user = new User();
        user.setId(10);

        FormationAttendance att = new FormationAttendance();
        att.setCheckInDate(null);

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.of(att));

        Formation res = formationService.registerAttendance(1, user);
        assertNotNull(res);
        assertNotNull(att.getCheckInDate());
    }

    @Test
    void testRegisterAttendanceExistingWithCheckInDate() {
        Formation formation = new Formation();
        formation.setId(1);

        User user = new User();
        user.setId(10);

        LocalDateTime date = LocalDateTime.now(ZoneId.systemDefault()).minusHours(1);
        FormationAttendance att = new FormationAttendance();
        att.setCheckInDate(date);

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.of(att));

        Formation res = formationService.registerAttendance(1, user);
        assertNotNull(res);
        assertEquals(date, att.getCheckInDate());
    }

	@Test
    void testSaveFormationWithFile() throws Exception {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setName("Physics with file");
        
        org.springframework.web.multipart.MultipartFile mockFile = 
            new MockMultipartFile("file", "test.pdf", APP_PDF, new byte[]{1, 2, 3});
            
        when(oneDriveService.uploadFile(mockFile, FORMATIONS_DIR)).thenReturn("https://onedrive.live.com/test.pdf");
        when(formationRepository.save(any(Formation.class))).thenReturn(formation);

        Formation res = formationService.saveFormation(formation, mockFile);
        assertNotNull(res);
        assertTrue(res.getDocumentUrls().contains("https://onedrive.live.com/test.pdf"));
        verify(oneDriveService, times(1)).uploadFile(mockFile, FORMATIONS_DIR);
    }

    @Test
    void testUpdateFormationWithNewFileAndExistingOldFile() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old");
        existing.getDocumentUrls().add("https://onedrive.live.com/old.pdf");

        Formation updatedDetails = new Formation();
        updatedDetails.setName("New");

        MockMultipartFile mockFile = 
            new MockMultipartFile("file", NEW_PDF, APP_PDF, new byte[]{4, 5, 6});

        when(formationRepository.findById(1)).thenReturn(Optional.of(existing));
        when(oneDriveService.uploadFile(mockFile, FORMATIONS_DIR)).thenReturn(NEW_ONEDRIVE_URL);
        when(formationRepository.save(any(Formation.class))).thenReturn(existing);

        Formation res = formationService.updateFormation(updatedDetails, 1, mockFile);
        
        assertNotNull(res);
        assertEquals("New", res.getName());
        verify(oneDriveService, times(1)).deleteFile("https://onedrive.live.com/old.pdf");
        verify(oneDriveService, times(1)).uploadFile(mockFile, FORMATIONS_DIR);
        assertTrue(res.getDocumentUrls().contains(NEW_ONEDRIVE_URL));
    }

    @Test
    void testUpdateFormationWithNullFile() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old");

        Formation updatedDetails = new Formation();
        updatedDetails.setName("Updated Name");

        when(formationRepository.findById(1)).thenReturn(Optional.of(existing));
        when(formationRepository.save(any(Formation.class))).thenReturn(existing);

        Formation res = formationService.updateFormation(updatedDetails, 1, null);
        assertNotNull(res);
        assertEquals("Updated Name", res.getName());
        verify(oneDriveService, never()).uploadFile(any(), any());
    }

    @Test
    void testUpdateFormationSameInstancePreservesDocuments() {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old Name");
        existing.getDocumentUrls().add("doc1||http://link1||item1");

        when(formationRepository.findById(1)).thenReturn(Optional.of(existing));
        when(formationRepository.save(any(Formation.class))).thenAnswer(i -> i.getArgument(0));

        Formation res = formationService.updateFormation(existing, 1);

        assertNotNull(res);
        assertEquals(1, res.getDocumentUrls().size());
        assertEquals("doc1||http://link1||item1", res.getDocumentUrls().get(0));
    }

    @Test
    void testDeleteFormationWithDocumentsInOneDrive() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setAttendances(new ArrayList<>());
        formation.getDocumentUrls().add("https://onedrive.live.com/doc1.pdf");

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));

        formationService.deleteFormation(1);
        
        verify(oneDriveService, times(1)).deleteFile("https://onedrive.live.com/doc1.pdf");
        verify(formationRepository, times(1)).delete(formation);
    }

    @Test
    void testDeleteFormationOneDriveExceptionHandled() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setAttendances(new ArrayList<>());
        formation.getDocumentUrls().add("https://onedrive.live.com/error.pdf");

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        doThrow(new RuntimeException("Cloud error")).when(oneDriveService).deleteFile(anyString());

        assertDoesNotThrow(() -> formationService.deleteFormation(1));
        verify(formationRepository, times(1)).delete(formation);
    }

    @Test
    void testUpdateFormationFileDeleteOneDriveExceptionHandled() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old");
        existing.getDocumentUrls().add("https://onedrive.live.com/error_old.pdf");

        Formation updatedDetails = new Formation();
        updatedDetails.setName("New");

        MockMultipartFile mockFile = 
            new MockMultipartFile("file", NEW_PDF, APP_PDF, new byte[]{4, 5, 6});

        when(formationRepository.findById(1)).thenReturn(Optional.of(existing));
        when(oneDriveService.uploadFile(mockFile, FORMATIONS_DIR)).thenReturn(NEW_ONEDRIVE_URL);
        when(formationRepository.save(any(Formation.class))).thenReturn(existing);
        
        // Forzamos que el borrado del archivo antiguo en OneDrive falle para entrar en el catch defensivo
        doThrow(new RuntimeException("Cloud delete error")).when(oneDriveService).deleteFile(anyString());

        assertDoesNotThrow(() -> formationService.updateFormation(updatedDetails, 1, mockFile));
        verify(oneDriveService, times(1)).uploadFile(mockFile, FORMATIONS_DIR);
    }

    @Test
    void testAddAttendeePushNotificationExceptionHandled() {
        Formation formation = new Formation();
        formation.setId(1);
        formation.setName("Spring Boot");
        formation.setAttendances(new ArrayList<>());

        User user = new User();
        user.setId(10);

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(userService.findUser(10)).thenReturn(user);
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.empty());
        
        // Forzamos que el servicio de notificaciones push falle para comprobar que el catch ignora el error
        NotificationContext notificationContextMock = mock(NotificationContext.class);
        doThrow(new RuntimeException("Push failed")).when(notificationContextMock).sendNotification(any(), anyString(), anyString());
        ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

        // Instanciamos temporalmente con el mock de push fallido
        FormationService customService = new FormationService(
            formationRepository, attendanceRepository, userService, oneDriveService, notificationContextMock, signatureStorageService, eventPublisher
        );

        assertDoesNotThrow(() -> customService.addAttendee(1, 10));
        verify(attendanceRepository, times(1)).save(any(FormationAttendance.class));
    }

    @Test
    void testDeleteFormationWithNullDocumentUrls() {
        Formation formation = mock(Formation.class);
        when(formation.getId()).thenReturn(1);
        when(formation.getAttendances()).thenReturn(new ArrayList<>());
        when(formation.getDocumentUrls()).thenReturn(null); // Fuerza la evaluación documento == null

        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));

        assertDoesNotThrow(() -> formationService.deleteFormation(1));
        verify(formationRepository, times(1)).delete(formation);
    }

    @Test
    void testUpdateFormationWithNewFileAndNullDocumentUrls() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old");
        // Inicializamos la lista como null explícitamente para reproducir el escenario
        existing.setDocumentUrls(null);

        Formation updatedDetails = new Formation();
        updatedDetails.setName("New");
        // Aseguramos que la lista en los detalles actualizados tampoco cause NPE si se evalúa
        updatedDetails.setDocumentUrls(new ArrayList<>());

        MockMultipartFile mockFile = 
            new MockMultipartFile("file", NEW_PDF, APP_PDF, new byte[]{4, 5, 6});

        when(formationRepository.findById(1)).thenReturn(Optional.of(existing));
        when(oneDriveService.uploadFile(mockFile, FORMATIONS_DIR)).thenReturn(NEW_ONEDRIVE_URL);
        when(formationRepository.save(any(Formation.class))).thenReturn(existing);

        Formation res = formationService.updateFormation(updatedDetails, 1, mockFile);
        
        assertNotNull(res);
        assertEquals("New", res.getName());
        verify(oneDriveService, times(1)).uploadFile(mockFile, FORMATIONS_DIR);
    }
}