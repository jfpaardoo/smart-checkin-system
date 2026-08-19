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
        when(userSessionRepository.findAllByTokenHash(anyString())).thenReturn(List.of());
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
    void testRegisterExistingSessionUpdates() {
        when(userSessionRepository.findAllByTokenHash(session1.getTokenHash())).thenReturn(List.of(session1));

        userSessionService.registerOrUpdateSession("testUser", "token1", "192.168.1.200", "Mozilla/5.0");

        assertEquals("192.168.1.200", session1.getIpAddress());
        assertTrue(session1.isActive());
        verify(userSessionRepository).save(session1);
    }

    @Test
    void testRegisterSessionWithNullsOrNullUserAgent() {
        userSessionService.registerOrUpdateSession(null, "token", "ip", "agent");
        userSessionService.registerOrUpdateSession("user", null, "ip", "agent");
        verify(userSessionRepository, never()).save(any(UserSession.class));

        when(userSessionRepository.findAllByTokenHash(anyString())).thenReturn(List.of());
        userSessionService.registerOrUpdateSession("user", "token", "ip", null);
        verify(userSessionRepository).save(argThat(s -> "Desconocido".equals(s.getUserAgent())));
    }

    @Test
    void testRevokeSessionNotFoundReturnsFalse() {
        when(userSessionRepository.findByIdAndUsername(99, "testUser")).thenReturn(Optional.empty());
        assertFalse(userSessionService.revokeSession("testUser", 99));
    }

    @Test
    void testIsSessionActive() {
        assertFalse(userSessionService.isSessionActive(null));

        when(userSessionRepository.findFirstByTokenHashOrderByLastActivityAtDesc(session1.getTokenHash())).thenReturn(Optional.of(session1));
        assertTrue(userSessionService.isSessionActive("token1"));

        session1.setActive(false);
        assertFalse(userSessionService.isSessionActive("token1"));

        when(userSessionRepository.findFirstByTokenHashOrderByLastActivityAtDesc(anyString())).thenReturn(Optional.empty());
        assertTrue(userSessionService.isSessionActive("unmigratedToken"));
    }

    @Test
    void testParseDeviceInfoAllBranches() {
        assertEquals("Dispositivo Desconocido", UserSessionService.parseDeviceInfo(null));
        assertEquals("Dispositivo Desconocido", UserSessionService.parseDeviceInfo("   "));

        String edge = UserSessionService.parseDeviceInfo("Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 Edg/120.0");
        assertTrue(edge.contains("Microsoft Edge"));
        assertTrue(edge.contains("Windows"));

        String ffLinux = UserSessionService.parseDeviceInfo("Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0");
        assertTrue(ffLinux.contains("Mozilla Firefox"));
        assertTrue(ffLinux.contains("Linux"));

        String android = UserSessionService.parseDeviceInfo("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36");
        assertTrue(android.contains("Google Chrome"));
        assertTrue(android.contains("Android"));

        String mac = UserSessionService.parseDeviceInfo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15");
        assertTrue(mac.contains("Safari"));
        assertTrue(mac.contains("macOS"));

        String ipad = UserSessionService.parseDeviceInfo("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/605.1.15");
        assertTrue(ipad.contains("Safari"));
        assertTrue(ipad.contains("iOS"));

        String custom = UserSessionService.parseDeviceInfo("CustomBot/1.0");
        assertTrue(custom.contains("Navegador"));
        assertTrue(custom.contains("SO"));
    }
}
