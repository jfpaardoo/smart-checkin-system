package org.springframework.samples.smartcheckin.formation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.samples.smartcheckin.notifications.PushNotificationSender;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FormationCheckinFacadeTests {

    private static final String EMP_001 = "EMP-001";
    private static final String JAVA_101 = "Java 101";
    private static final String NEW_NAME = "New Name";
    private static final String FILES_PARAM = "files";
    private static final String APPLICATION_PDF = "application/pdf";
    private static final String DOC2_URL = "http://doc2.pdf";

    @Mock
    private FormationService formationService;

    @Mock
    private UserService userService;

    @Mock
    private CloudStorageAdapter cloudStorageAdapter;

    @Mock
    private PushNotificationSender pushNotificationSender;

    @InjectMocks
    private FormationCheckinFacade facade;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1);
        sampleUser.setUsername("testuser");
        sampleUser.setPersonalCode(EMP_001);
    }

    @Test
    void testNotifyFormationsUpdateHandlesNullAndExceptionGracefully() {
        doThrow(new RuntimeException("Push error")).when(pushNotificationSender).send(anyString(), anyString(), anyString());
        assertDoesNotThrow(() -> facade.notifyFormationsUpdate(10));
        assertDoesNotThrow(() -> facade.notifyFormationsUpdate(null));
    }

    @Test
    void testCreateFormationWithFilesSuccess() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(JAVA_101);
        req.setDescription("Learn Java");
        req.setFormationDate(LocalDateTime.now(ZoneId.of("Europe/Madrid")));

        MockMultipartFile validFile = new MockMultipartFile(FILES_PARAM, "doc.pdf", APPLICATION_PDF, "content".getBytes());
        MockMultipartFile emptyFile = new MockMultipartFile(FILES_PARAM, "empty.txt", "text/plain", new byte[0]);
        List<MultipartFile> files = List.of(validFile, emptyFile);

        when(cloudStorageAdapter.uploadFile(validFile, JAVA_101)).thenReturn("http://onedrive/doc.pdf");
        
        Formation savedFormation = new Formation();
        savedFormation.setId(100);
        when(formationService.saveFormation(any(Formation.class))).thenReturn(savedFormation);

        Formation result = facade.createFormation(req, files);

        assertNotNull(result);
        assertEquals(100, result.getId());
        verify(cloudStorageAdapter, times(1)).uploadFile(validFile, JAVA_101);
    }

    @Test
    void createFormationFileUploadExceptionThrowsException() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName(JAVA_101);

        MockMultipartFile file = new MockMultipartFile(FILES_PARAM, "doc.pdf", APPLICATION_PDF, "content".getBytes());
        when(cloudStorageAdapter.uploadFile(any(), anyString())).thenThrow(new IOException("Upload failed"));

        List<MultipartFile> files = List.of(file);

        assertThrows(IllegalStateException.class, () -> facade.createFormation(req, files));

        verify(formationService, never()).saveFormation(any());
    }

    @Test
    void testUpdateFormationNotFoundThrowsException() {
        FormationRequest req = new FormationRequest();
        when(formationService.findById(1)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> facade.updateFormation(1, req, null));
    }

    @Test
    void testUpdateFormationRemovesAndAddsFilesSuccess() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old Name");
        existing.setDocumentUrls(new ArrayList<>(List.of("http://doc1.pdf", DOC2_URL)));

        when(formationService.findById(1)).thenReturn(Optional.of(existing));

        FormationRequest req = new FormationRequest();
        req.setName(NEW_NAME);
        req.setExistingDocumentUrls(List.of("http://doc1.pdf"));

        MockMultipartFile newFile = new MockMultipartFile(FILES_PARAM, "new.pdf", APPLICATION_PDF, "data".getBytes());
        when(cloudStorageAdapter.uploadFile(newFile, NEW_NAME)).thenReturn("http://new.pdf");
        doThrow(new RuntimeException("Delete error")).when(cloudStorageAdapter).deleteFile(DOC2_URL);

        Formation updated = new Formation();
        updated.setId(1);
        when(formationService.updateFormation(any(), eq(1))).thenReturn(updated);

        Formation result = facade.updateFormation(1, req, List.of(newFile));

        assertNotNull(result);
        verify(cloudStorageAdapter).deleteFile(DOC2_URL);
        verify(cloudStorageAdapter).uploadFile(newFile, NEW_NAME);
    }

    @Test
    void testRegisterAttendanceWithNullPersonalCodeUsesCurrentUserCode() {
        when(userService.findCurrentUser()).thenReturn(sampleUser);
        Formation formation = new Formation();
        formation.setId(5);
        when(formationService.registerAttendance(5, EMP_001)).thenReturn(formation);

        Formation result = facade.registerAttendance(5, null);
        assertNotNull(result);
        assertEquals(5, result.getId());
    }

    @Test
    void testCheckoutAttendanceSuccess() {
        when(userService.findCurrentUser()).thenReturn(sampleUser);
        Formation formation = new Formation();
        formation.setId(5);
        when(formationService.checkoutAttendance(5, EMP_001, "signatureBase64", null)).thenReturn(formation);

        Formation result = facade.checkoutAttendance(5, "signatureBase64");
        assertNotNull(result);
    }

    @Test
    void testAddRemoveAndDeleteAttendeeMethodsSuccess() {
        facade.addAttendee(1, 10);
        verify(formationService).addAttendee(1, 10);

        facade.removeAttendee(1, 10);
        verify(formationService).removeAttendee(1, 10);

        facade.deleteFormation(1);
        verify(formationService).deleteFormation(1);
    }
}
