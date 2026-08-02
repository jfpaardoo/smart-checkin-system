package org.springframework.samples.smartcheckin.audit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionService.class);

    private final AuditLogRepository auditLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public AnomalyDetectionService(AuditLogRepository auditLogRepository, SimpMessagingTemplate messagingTemplate) {
        this.auditLogRepository = auditLogRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void recordFailedLogin(String username, String ipAddress, int currentAttempts) {
        // Record the failed attempt in audit
        AuditLog log = new AuditLog("LOGIN_FAILED", username, "Failed login attempt for user: " + username, ipAddress);
        auditLogRepository.save(log);
        messagingTemplate.convertAndSend("/topic/audit", "NEW_LOG");

        if (currentAttempts >= 5) {
            triggerSecurityAnomaly(username, ipAddress, "Multiple failed login attempts (>= 5) detected for user: " + username);
        }
    }

    private void triggerSecurityAnomaly(String username, String ipAddress, String reason) {
        logger.warn("SECURITY ANOMALY DETECTED: {}", reason);
        AuditLog anomalyLog = new AuditLog("SECURITY_ANOMALY", username, reason, ipAddress);
        auditLogRepository.save(anomalyLog);
        
        // Notify clients to refresh audit log
        messagingTemplate.convertAndSend("/topic/audit", "NEW_LOG");
        // Also send a real-time alert via WebSocket for admins
        messagingTemplate.convertAndSend("/topic/alerts", "Alerta de Seguridad: " + reason);
    }
}
