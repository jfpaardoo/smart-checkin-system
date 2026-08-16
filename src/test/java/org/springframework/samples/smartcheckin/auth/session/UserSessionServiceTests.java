package org.springframework.samples.smartcheckin.auth.session;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class UserSessionServiceTests {

    @Mock
    private UserSessionRepository userSessionRepository;

    @InjectMocks
    private UserSessionService userSessionService;

    private UserSession session1;
    private UserSession session2;

    @BeforeEach
    void setUp() {
        session1 = UserSession.builder()
                .username("testUser")
                .tokenHash(UserSessionService.hashToken("token1"))
                .ipAddress("192.168.1.100")
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")
                .deviceInfo("Google Chrome en Windows 10/11")
                .lastActivityAt(LocalDateTime.now(java.time.ZoneId.systemDefault()))
                .active(true)
                .build();
        session1.setId(1);
        session1.setCreatedAt(LocalDateTime.now(java.time.ZoneId.systemDefault()));

        session2 = UserSession.builder()
                .username("testUser")
                .tokenHash(UserSessionService.hashToken("token2"))
                .ipAddress("192.168.1.105")
                .userAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
                .deviceInfo("Safari en iOS")
                .lastActivityAt(LocalDateTime.now(java.time.ZoneId.systemDefault()).minusHours(1))
                .active(true)
                .build();
        session2.setId(2);
        session2.setCreatedAt(LocalDateTime.now(java.time.ZoneId.systemDefault()).minusHours(2));
    }

    @Test
    void testRegisterNewSession() {
        when(userSessionRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(i -> i.getArgument(0));

        userSessionService.registerOrUpdateSession("newUser", "myToken", "10.0.0.1", "Mozilla/5.0 Firefox");

        verify(userSessionRepository, times(1)).save(any(UserSession.class));
    }

    @Test
    void testGetActiveSessions() {
        when(userSessionRepository.findAllByUsernameAndActiveTrueOrderByLastActivityAtDesc("testUser"))
                .thenReturn(List.of(session1, session2));

        List<UserSessionDTO> dtos = userSessionService.getActiveSessions("testUser", "token1");

        assertEquals(2, dtos.size());
        assertTrue(dtos.get(0).isCurrent());
        assertFalse(dtos.get(1).isCurrent());
    }

    @Test
    void testRevokeSession() {
        when(userSessionRepository.findByIdAndUsername(1, "testUser")).thenReturn(Optional.of(session1));
        when(userSessionRepository.save(any(UserSession.class))).thenReturn(session1);

        boolean result = userSessionService.revokeSession("testUser", 1);

        assertTrue(result);
        assertFalse(session1.isActive());
        verify(userSessionRepository).save(session1);
    }

    @Test
    void testRevokeOtherSessions() {
        when(userSessionRepository.findAllByUsernameAndActiveTrueOrderByLastActivityAtDesc("testUser"))
                .thenReturn(List.of(session1, session2));

        int count = userSessionService.revokeOtherSessions("testUser", "token1");

        assertEquals(1, count);
        assertTrue(session1.isActive());
        assertFalse(session2.isActive());
        verify(userSessionRepository).save(session2);
    }

    @Test
    void testParseDeviceInfo() {
        String info1 = UserSessionService.parseDeviceInfo("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0");
        assertTrue(info1.contains("Chrome"));
        assertTrue(info1.contains("Windows"));

        String info2 = UserSessionService.parseDeviceInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1");
        assertTrue(info2.contains("Safari"));
        assertTrue(info2.contains("iOS"));
    }
}
