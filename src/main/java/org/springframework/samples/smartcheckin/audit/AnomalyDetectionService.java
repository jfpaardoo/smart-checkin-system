package org.springframework.samples.smartcheckin.audit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionService.class);
    private static final String AUDIT_TOPIC = "/topic/audit";
    private static final String LOG_UPDATE = "NEW_LOG";

    private final AuditLogRepository auditLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public AnomalyDetectionService(AuditLogRepository auditLogRepository, SimpMessagingTemplate messagingTemplate) {
        this.auditLogRepository = auditLogRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void recordSuccessfulLogin(String username, String ipAddress, String authMethod) {
        String details = "User logged in successfully (" + authMethod + ")";
        AuditLog log = new AuditLog("LOGIN_SUCCESS", username, details, ipAddress);
        auditLogRepository.save(log);
        messagingTemplate.convertAndSend(AUDIT_TOPIC, LOG_UPDATE);
    }

    public void recordLogout(String username, String ipAddress) {
        AuditLog log = new AuditLog("LOGOUT", username, "User logged out", ipAddress);
        auditLogRepository.save(log);
        messagingTemplate.convertAndSend(AUDIT_TOPIC, LOG_UPDATE);
    }

    public void recordFailedLogin(String username, String ipAddress, int currentAttempts) {
        // Record the failed attempt in audit
        AuditLog log = new AuditLog("LOGIN_FAILED", username, "Failed login attempt for user: " + username, ipAddress);
        auditLogRepository.save(log);
        messagingTemplate.convertAndSend(AUDIT_TOPIC, LOG_UPDATE);

        if (currentAttempts >= 5) {
            triggerSecurityAnomaly(username, ipAddress, "Multiple failed login attempts (>= 5) detected for user: " + username);
        }
    }

    private void triggerSecurityAnomaly(String username, String ipAddress, String reason) {
        logger.warn("SECURITY ANOMALY DETECTED: {}", reason);
        AuditLog anomalyLog = new AuditLog("SECURITY_ANOMALY", username, reason, ipAddress);
        auditLogRepository.save(anomalyLog);
        
        // Notify clients to refresh audit log
        messagingTemplate.convertAndSend(AUDIT_TOPIC, LOG_UPDATE);
        // Also send a real-time alert via WebSocket for admins
        messagingTemplate.convertAndSend("/topic/alerts", "Alerta de Seguridad: " + reason);
    }
}
