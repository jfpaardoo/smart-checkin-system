package org.springframework.samples.smartcheckin.audit;

import java.util.concurrent.TimeUnit;
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

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class LoginFailureListener implements ApplicationListener<AuthenticationFailureBadCredentialsEvent> {

    private static final Logger logger = LoggerFactory.getLogger(LoginFailureListener.class);
    private static final int MAX_FAILED_ATTEMPTS = 3;

    private final SimpMessagingTemplate messagingTemplate;
    private final AuditService auditService;
    
    // Bounded in-memory cache to track failures and prevent memory exhaustion DoS
    private final Cache<String, AtomicInteger> failedAttempts = Caffeine.newBuilder()
            .expireAfterWrite(15, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

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
        AtomicInteger counter = failedAttempts.get(key, k -> new AtomicInteger(0));
        int attempts = counter.incrementAndGet();

        logger.warn("Failed login attempt {} for user {} from IP {}", attempts, username, ipAddress);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            String alertMessage = "Alerta de Seguridad: Múltiples intentos fallidos de login (" + attempts + ") para el usuario: " + username + " desde IP: " + ipAddress;
            
            // 1. Send WebSocket Alert
            messagingTemplate.convertAndSend("/topic/alerts", alertMessage);
            
            // 2. Log in Audit Database with Cryptographic Hash Chain
            AuditLog log = new AuditLog("SECURITY_ALERT_BRUTE_FORCE", "SYSTEM", alertMessage, ipAddress);
            auditService.recordAuditLog(log);
            
            logger.error("SECURITY ALERT TRIGGERED: {}", alertMessage);
            
            // Reset after alert to prevent spamming
            counter.set(0);
        }
    }

    private String getClientIP() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                return xfHeader.split(",")[0].trim();
            }
            return request.getRemoteAddr() != null ? request.getRemoteAddr() : "UNKNOWN_IP";
        }
        return "UNKNOWN_IP";
    }
}
