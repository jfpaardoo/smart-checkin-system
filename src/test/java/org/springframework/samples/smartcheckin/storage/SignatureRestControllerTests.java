package org.springframework.samples.smartcheckin.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.exceptions.AccessDeniedException;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class SignatureRestControllerTests {

    private LocalFileSystemService localFileSystemService;
    private UserService userService;
    private CheckinRepository checkinRepository;
    private FormationAttendanceRepository attendanceRepository;
    private FormationRepository formationRepository;
    private SignatureRestController controller;

    private User regularUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        localFileSystemService = mock(LocalFileSystemService.class);
        userService = mock(UserService.class);
        checkinRepository = mock(CheckinRepository.class);
        attendanceRepository = mock(FormationAttendanceRepository.class);
        formationRepository = mock(FormationRepository.class);

        controller = new SignatureRestController(
                localFileSystemService,
                userService,
                checkinRepository,
                attendanceRepository,
                formationRepository
        );

        regularUser = new User();
        regularUser.setId(1);
        regularUser.setUsername("user1");
        regularUser.setFirstName("Juan");
        regularUser.setLastName("Perez");
        Authorities userAuth = new Authorities();
        userAuth.setAuthority("USER");
        regularUser.setAuthority(userAuth);

        adminUser = new User();
        adminUser.setId(2);
        adminUser.setUsername("admin");
        Authorities adminAuth = new Authorities();
        adminAuth.setAuthority("ADMIN");
        adminUser.setAuthority(adminAuth);
    }

    @Test
    void testGetSignatureAllowedWhenUserIsOwnerOfCheckin() {
        byte[] mockImage = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
        when(userService.findCurrentUser()).thenReturn(regularUser);
        when(checkinRepository.existsBySignatureAndUserId("valid.png", 1)).thenReturn(true);
        when(localFileSystemService.loadSignature("valid.png")).thenReturn(mockImage);

        ResponseEntity<byte[]> response = controller.getSignature("valid.png");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.IMAGE_PNG, response.getHeaders().getContentType());
        assertNotNull(response.getBody());
    }

    @Test
    void testGetSignatureAllowedWhenUserIsAdminEvenIfNotOwner() {
        byte[] mockImage = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00};
        when(userService.findCurrentUser()).thenReturn(adminUser);
        when(localFileSystemService.loadSignature("other_user.jpg")).thenReturn(mockImage);

        ResponseEntity<byte[]> response = controller.getSignature("other_user.jpg");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.IMAGE_JPEG, response.getHeaders().getContentType());
        verify(checkinRepository, never()).existsBySignatureAndUserId(any(), any());
    }

    @Test
    void testGetSignatureDeniedWhenUserIsNotOwnerNorTrainerNorAdmin() {
        when(userService.findCurrentUser()).thenReturn(regularUser);
        when(checkinRepository.existsBySignatureAndUserId("secret.png", 1)).thenReturn(false);
        when(attendanceRepository.existsBySignatureAndUserId("secret.png", 1)).thenReturn(false);
        when(attendanceRepository.isTrainerOfAttendance(eq("secret.png"), eq("user1"), anyString())).thenReturn(false);
        when(formationRepository.isTrainerOfFormationSignature(eq("secret.png"), eq("user1"), anyString())).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> controller.getSignature("secret.png"));
        verify(localFileSystemService, never()).loadSignature(any());
    }

    @Test
    void testGetSignatureAllowedWhenUserIsTrainer() {
        byte[] mockImage = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
        when(userService.findCurrentUser()).thenReturn(regularUser);
        when(checkinRepository.existsBySignatureAndUserId("student.png", 1)).thenReturn(false);
        when(attendanceRepository.existsBySignatureAndUserId("student.png", 1)).thenReturn(false);
        when(attendanceRepository.isTrainerOfAttendance(eq("student.png"), eq("user1"), eq("Juan Perez"))).thenReturn(true);
        when(localFileSystemService.loadSignature("student.png")).thenReturn(mockImage);

        ResponseEntity<byte[]> response = controller.getSignature("student.png");

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testGetSignatureNotFoundNull() {
        when(userService.findCurrentUser()).thenReturn(adminUser);
        when(localFileSystemService.loadSignature("invalid.png")).thenReturn(null);

        ResponseEntity<byte[]> response = controller.getSignature("invalid.png");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testGetSignatureNotFoundEmpty() {
        when(userService.findCurrentUser()).thenReturn(adminUser);
        when(localFileSystemService.loadSignature("empty.png")).thenReturn(new byte[0]);

        ResponseEntity<byte[]> response = controller.getSignature("empty.png");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}