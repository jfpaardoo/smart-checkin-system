package org.springframework.samples.smartcheckin.audit;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class LoginFailureListener implements ApplicationListener<AuthenticationFailureBadCredentialsEvent> {

    private static final Logger logger = LoggerFactory.getLogger(LoginFailureListener.class);
    private static final int MAX_FAILED_ATTEMPTS = 3;

    private final SimpMessagingTemplate messagingTemplate;
    private final AuditService auditService;
    
    // In-memory cache to track failures (In production, consider Redis or DB)
    private final ConcurrentHashMap<String, AtomicInteger> failedAttempts = new ConcurrentHashMap<>();

    @Autowired
    public LoginFailureListener(SimpMessagingTemplate messagingTemplate, AuditService auditService) {
        this.messagingTemplate = messagingTemplate;
        this.auditService = auditService;
    }

    @Override
    public void onApplicationEvent(@NonNull AuthenticationFailureBadCredentialsEvent event) {
        String username = event.getAuthentication().getName();
        String ipAddress = getClientIP();

        String key = username + "-" + ipAddress;
        failedAttempts.putIfAbsent(key, new AtomicInteger(0));
        int attempts = failedAttempts.get(key).incrementAndGet();

        logger.warn("Failed login attempt {} for user {} from IP {}", attempts, username, ipAddress);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            String alertMessage = "Alerta de Seguridad: Múltiples intentos fallidos de login (" + attempts + ") para el usuario: " + username + " desde IP: " + ipAddress;
            
            // 1. Send WebSocket Alert
            messagingTemplate.convertAndSend("/topic/alerts", alertMessage);
            
            // 2. Log in Audit Database with Cryptographic Hash Chain
            AuditLog log = new AuditLog("SECURITY_ALERT_BRUTE_FORCE", "SYSTEM", alertMessage, ipAddress);
            auditService.recordAuditLog(log);
            
            logger.error("SECURITY ALERT TRIGGERED: {}", alertMessage);
            
            // Reset after alert to prevent spamming, or you could keep increasing it and alert every 3rd time
            failedAttempts.get(key).set(0);
        }
    }

    private String getClientIP() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader == null) {
                return request.getRemoteAddr();
            }
            return xfHeader.split(",")[0];
        }
        return "UNKNOWN_IP";
    }
}
