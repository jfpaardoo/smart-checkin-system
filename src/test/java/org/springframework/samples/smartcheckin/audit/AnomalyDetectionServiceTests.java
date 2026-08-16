package org.springframework.samples.smartcheckin.audit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class AnomalyDetectionServiceTests {

    @Mock
    private AuditService auditService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AnomalyDetectionService anomalyDetectionService;

    @Test
    void testRecordSuccessfulLogin() {
        anomalyDetectionService.recordSuccessfulLogin("john", "192.168.1.50", "PASSWORD");
        verify(auditService, times(1)).recordAuditLog(any(AuditLog.class));
    }

    @Test
    void testRecordLogoutDefault() {
        anomalyDetectionService.recordLogout("john", "192.168.1.50");
        verify(auditService, times(1)).recordAuditLog(any(AuditLog.class));
    }

    @Test
    void testRecordLogoutWithNullOrBlankReason() {
        anomalyDetectionService.recordLogout("john", "192.168.1.50", null);
        anomalyDetectionService.recordLogout("john", "192.168.1.50", "   ");
        verify(auditService, times(2)).recordAuditLog(any(AuditLog.class));
    }

    @Test
    void testRecordLogoutWithExplicitReason() {
        anomalyDetectionService.recordLogout("john", "192.168.1.50", "Session expired");
        verify(auditService, times(1)).recordAuditLog(any(AuditLog.class));
    }

    @Test
    void testRecordFailedLogin_underLimit() {
        String username = "testuser";
        String ipAddress = "192.168.1.1";
        int currentAttempts = 3;

        anomalyDetectionService.recordFailedLogin(username, ipAddress, currentAttempts);

        verify(auditService, times(1)).recordAuditLog(any(AuditLog.class));
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void testRecordFailedLogin_overLimit_triggersAnomaly() {
        String username = "testuser";
        String ipAddress = "192.168.1.1";
        int currentAttempts = 5;

        anomalyDetectionService.recordFailedLogin(username, ipAddress, currentAttempts);

        verify(auditService, times(2)).recordAuditLog(any(AuditLog.class));
        verify(messagingTemplate, times(1)).convertAndSend("/topic/alerts", "Alerta de Seguridad: Multiple failed login attempts (>= 5) detected for user: " + username);
    }

    @Test
    void testRecordFailedLogin_withoutMessagingTemplate() {
        AnomalyDetectionService serviceWithoutMessaging = new AnomalyDetectionService(auditService, null);
        serviceWithoutMessaging.recordFailedLogin("user2", "127.0.0.1", 6);

        verify(auditService, times(2)).recordAuditLog(any(AuditLog.class));
    }
}
