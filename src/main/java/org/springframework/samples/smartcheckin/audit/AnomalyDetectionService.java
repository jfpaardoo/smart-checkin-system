package org.springframework.samples.smartcheckin.audit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.samples.smartcheckin.notifications.PushNotificationSender;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;

@Service
public class AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionService.class);

    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;
    private PushNotificationSender pushNotificationSender;
    private UserService userService;

    public AnomalyDetectionService(AuditService auditService, SimpMessagingTemplate messagingTemplate) {
        this(auditService, messagingTemplate, null, null);
    }

    @Autowired
    public AnomalyDetectionService(AuditService auditService, 
                                   SimpMessagingTemplate messagingTemplate,
                                   @Autowired(required = false) PushNotificationSender pushNotificationSender,
                                   @Autowired(required = false) UserService userService) {
        this.auditService = auditService;
        this.messagingTemplate = messagingTemplate;
        this.pushNotificationSender = pushNotificationSender;
        this.userService = userService;
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
        
        sendAlertWebSocket(reason);
        notifyAdminsOfAnomaly(reason);
        notifyAffectedUserOfAnomaly(username);
    }

    private void sendAlertWebSocket(String reason) {
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/alerts", "Alerta de Seguridad: " + reason);
        }
    }

    private void notifyAdminsOfAnomaly(String reason) {
        if (pushNotificationSender == null || userService == null) {
            return;
        }
        try {
            Iterable<User> admins = userService.findAllByAuthority("ADMIN");
            if (admins == null) {
                return;
            }
            for (User admin : admins) {
                if (admin.getUsername() != null && !admin.getUsername().startsWith("GDPR_DEL_")) {
                    pushNotificationSender.send(admin.getUsername(), "Alerta de Seguridad", reason);
                }
            }
        } catch (Exception e) {
            logger.warn("Error enviando push de anomalía a admins: {}", e.getMessage());
        }
    }

    private void notifyAffectedUserOfAnomaly(String username) {
        if (pushNotificationSender == null || username == null 
                || username.equalsIgnoreCase("anonymous") || username.startsWith("GDPR_DEL_")) {
            return;
        }
        try {
            pushNotificationSender.send(username, "Alerta de Seguridad en tu cuenta",
                "Se han detectado múltiples intentos fallidos de inicio de sesión. Tu cuenta ha sido protegida temporalmente.");
        } catch (Exception e) {
            logger.warn("Error enviando push de seguridad a usuario {}: {}", username, e.getMessage());
        }
    }
}
