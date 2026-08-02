package org.springframework.samples.smartcheckin.audit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class AnomalyDetectionServiceTests {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AnomalyDetectionService anomalyDetectionService;

    @BeforeEach
    void setUp() {
        // No setup required since @InjectMocks handles it
    }

    @Test
    void testRecordFailedLogin_underLimit() {
        String username = "testuser";
        String ipAddress = "192.168.1.1";
        int currentAttempts = 3;

        anomalyDetectionService.recordFailedLogin(username, ipAddress, currentAttempts);

        // Verify the normal failed login was saved
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
        verify(messagingTemplate, times(1)).convertAndSend("/topic/audit", "NEW_LOG");
        
        // Verify no security anomaly was triggered (which would mean 2 saves and 2 websocket messages to /topic/audit + 1 to alerts)
        verify(messagingTemplate, times(0)).convertAndSend(eq("/topic/alerts"), anyString());
    }

    @Test
    void testRecordFailedLogin_overLimit_triggersAnomaly() {
        String username = "testuser";
        String ipAddress = "192.168.1.1";
        int currentAttempts = 5;

        anomalyDetectionService.recordFailedLogin(username, ipAddress, currentAttempts);

        // Verify that 2 audit logs were saved (one for LOGIN_FAILED, one for SECURITY_ANOMALY)
        verify(auditLogRepository, times(2)).save(any(AuditLog.class));
        
        // Verify /topic/audit got pinged twice
        verify(messagingTemplate, times(2)).convertAndSend("/topic/audit", "NEW_LOG");
        
        // Verify the alert was sent
        verify(messagingTemplate, times(1)).convertAndSend("/topic/alerts", "Alerta de Seguridad: Multiple failed login attempts (>= 5) detected for user: " + username);
    }
}
