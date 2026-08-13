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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FormationCheckinFacadeTests {

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
        sampleUser.setPersonalCode("EMP-001");
    }

    @Test
    void notifyFormationsUpdate_handlesNullAndExceptionGracefully() {
        doThrow(new RuntimeException("Push error")).when(pushNotificationSender).send(anyString(), anyString(), anyString());
        assertDoesNotThrow(() -> facade.notifyFormationsUpdate(10));
        assertDoesNotThrow(() -> facade.notifyFormationsUpdate(null));
    }

    @Test
    void createFormation_withFiles_success() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName("Java 101");
        req.setDescription("Learn Java");
        req.setFormationDate(LocalDateTime.now());

        MockMultipartFile validFile = new MockMultipartFile("files", "doc.pdf", "application/pdf", "content".getBytes());
        MockMultipartFile emptyFile = new MockMultipartFile("files", "empty.txt", "text/plain", new byte[0]);
        List<MultipartFile> files = List.of(validFile, emptyFile);

        when(cloudStorageAdapter.uploadFile(validFile, "Java 101")).thenReturn("http://onedrive/doc.pdf");
        
        Formation savedFormation = new Formation();
        savedFormation.setId(100);
        when(formationService.saveFormation(any(Formation.class))).thenReturn(savedFormation);

        Formation result = facade.createFormation(req, files);

        assertNotNull(result);
        assertEquals(100, result.getId());
        verify(cloudStorageAdapter, times(1)).uploadFile(validFile, "Java 101");
    }

    @Test
    void createFormation_fileUploadException_continuesAndSaves() throws Exception {
        FormationRequest req = new FormationRequest();
        req.setName("Java 101");

        MockMultipartFile file = new MockMultipartFile("files", "doc.pdf", "application/pdf", "content".getBytes());
        when(cloudStorageAdapter.uploadFile(any(), anyString())).thenThrow(new IOException("Upload failed"));

        Formation saved = new Formation();
        saved.setId(101);
        when(formationService.saveFormation(any())).thenReturn(saved);

        Formation result = facade.createFormation(req, List.of(file));
        assertNotNull(result);
    }

    @Test
    void updateFormation_notFound_throwsException() {
        FormationRequest req = new FormationRequest();
        when(formationService.findById(1)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> facade.updateFormation(1, req, null));
    }

    @Test
    void updateFormation_removesAndAddsFiles_success() throws Exception {
        Formation existing = new Formation();
        existing.setId(1);
        existing.setName("Old Name");
        existing.setDocumentUrls(new ArrayList<>(List.of("http://doc1.pdf", "http://doc2.pdf")));

        when(formationService.findById(1)).thenReturn(Optional.of(existing));

        FormationRequest req = new FormationRequest();
        req.setName("New Name");
        req.setExistingDocumentUrls(List.of("http://doc1.pdf"));

        MockMultipartFile newFile = new MockMultipartFile("files", "new.pdf", "application/pdf", "data".getBytes());
        when(cloudStorageAdapter.uploadFile(newFile, "New Name")).thenReturn("http://new.pdf");
        doThrow(new RuntimeException("Delete error")).when(cloudStorageAdapter).deleteFile("http://doc2.pdf");

        Formation updated = new Formation();
        updated.setId(1);
        when(formationService.updateFormation(any(), eq(1))).thenReturn(updated);

        Formation result = facade.updateFormation(1, req, List.of(newFile));

        assertNotNull(result);
        verify(cloudStorageAdapter).deleteFile("http://doc2.pdf");
        verify(cloudStorageAdapter).uploadFile(newFile, "New Name");
    }

    @Test
    void registerAttendance_withNullPersonalCode_usesCurrentUserCode() {
        when(userService.findCurrentUser()).thenReturn(sampleUser);
        Formation formation = new Formation();
        formation.setId(5);
        when(formationService.registerAttendance(5, "EMP-001")).thenReturn(formation);

        Formation result = facade.registerAttendance(5, null);
        assertNotNull(result);
        assertEquals(5, result.getId());
    }

    @Test
    void checkoutAttendance_success() {
        when(userService.findCurrentUser()).thenReturn(sampleUser);
        Formation formation = new Formation();
        formation.setId(5);
        when(formationService.checkoutAttendance(5, "EMP-001", "signatureBase64")).thenReturn(formation);

        Formation result = facade.checkoutAttendance(5, "signatureBase64");
        assertNotNull(result);
    }

    @Test
    void addRemoveAndDeleteAttendeeMethods_success() {
        facade.addAttendee(1, 10);
        verify(formationService).addAttendee(1, 10);

        facade.removeAttendee(1, 10);
        verify(formationService).removeAttendee(1, 10);

        facade.deleteFormation(1);
        verify(formationService).deleteFormation(1);
    }
}
