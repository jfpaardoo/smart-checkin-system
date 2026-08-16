package org.springframework.samples.smartcheckin.audit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionService.class);

    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public AnomalyDetectionService(AuditService auditService, SimpMessagingTemplate messagingTemplate) {
        this.auditService = auditService;
        this.messagingTemplate = messagingTemplate;
    }

    public void recordSuccessfulLogin(String username, String ipAddress, String authMethod) {
        String details = "User logged in successfully (" + authMethod + ")";
        AuditLog log = AuditLog.builder()
                .action("LOGIN_SUCCESS")
                .username(username)
                .details(details)
                .ipAddress(ipAddress)
                .timestamp(java.time.LocalDateTime.now(java.time.ZoneId.systemDefault()))
                .build();
        auditService.recordAuditLog(log);
    }

    public void recordLogout(String username, String ipAddress) {
        recordLogout(username, ipAddress, "Manual");
    }

    public void recordLogout(String username, String ipAddress, String reason) {
        String details = (reason != null && !reason.isBlank()) ? "User logged out (" + reason + ")" : "User logged out";
        AuditLog log = AuditLog.builder()
                .action("LOGOUT")
                .username(username)
                .details(details)
                .ipAddress(ipAddress)
                .timestamp(java.time.LocalDateTime.now(java.time.ZoneId.systemDefault()))
                .build();
        auditService.recordAuditLog(log);
    }

    public void recordFailedLogin(String username, String ipAddress, int currentAttempts) {
        // Record the failed attempt in audit
        AuditLog log = AuditLog.builder()
                .action("LOGIN_FAILED")
                .username(username)
                .details("Failed login attempt for user: " + username)
                .ipAddress(ipAddress)
                .timestamp(java.time.LocalDateTime.now(java.time.ZoneId.systemDefault()))
                .build();
        auditService.recordAuditLog(log);

        if (currentAttempts >= 5) {
            triggerSecurityAnomaly(username, ipAddress, "Multiple failed login attempts (>= 5) detected for user: " + username);
        }
    }

    private void triggerSecurityAnomaly(String username, String ipAddress, String reason) {
        logger.warn("SECURITY ANOMALY DETECTED: {}", reason);
        AuditLog anomalyLog = AuditLog.builder()
                .action("SECURITY_ANOMALY")
                .username(username)
                .details(reason)
                .ipAddress(ipAddress)
                .timestamp(java.time.LocalDateTime.now(java.time.ZoneId.systemDefault()))
                .build();
        auditService.recordAuditLog(anomalyLog);
        
        // Also send a real-time alert via WebSocket for admins
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/alerts", "Alerta de Seguridad: " + reason);
        }
    }
}
