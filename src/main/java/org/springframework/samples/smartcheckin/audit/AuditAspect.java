package org.springframework.samples.smartcheckin.audit;

import java.lang.reflect.Method;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Aspect
@Component
public class AuditAspect {

    private final AuditService auditService;
    private final HttpServletRequest request;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AuditAspect(AuditService auditService, HttpServletRequest request) {
        this.auditService = auditService;
        this.request = request;
    }

    public AuditAspect(AuditLogRepository auditLogRepository, HttpServletRequest request, SimpMessagingTemplate messagingTemplate) {
        this(new AuditService(auditLogRepository, messagingTemplate), request);
    }

    private static final String DEFAULT_IP = "127.0.0.1";

    private String getClientIP(HttpServletRequest req) {
        if (req == null) {
            return DEFAULT_IP;
        }
        try {
            String xfHeader = req.getHeader("X-Forwarded-For");
            if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
                return req.getRemoteAddr() != null ? req.getRemoteAddr() : DEFAULT_IP;
            }
            return xfHeader.split(",")[0].trim();
        } catch (Exception e) {
            return DEFAULT_IP;
        }
    }

    private void logAudit(String action, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";
        String ipAddress = getClientIP(request);

        AuditLog log = AuditLog.builder()
                .action(action)
                .username(username)
                .details(details)
                .ipAddress(ipAddress)
                .timestamp(java.time.LocalDateTime.now(java.time.ZoneId.systemDefault()))
                .build();
        auditService.recordAuditLog(log);
    }

    @AfterReturning(pointcut = "@annotation(auditable)", returning = "result")
    public void logAuditableAction(JoinPoint joinPoint, Auditable auditable, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && !responseEntity.getStatusCode().is2xxSuccessful()) {
            return;
        }

        String action = auditable.action();
        ObjectNode detailsJson = objectMapper.createObjectNode();

        if (!auditable.details().isEmpty()) {
            detailsJson.put("message", auditable.details());
        }

        extractDynamicDetails(result, detailsJson);

        String details = detailsJson.isEmpty() ? "" : detailsJson.toString();
        logAudit(action, details);
    }

    private void extractDynamicDetails(Object result, ObjectNode detailsJson) {
        Object body = result;
        if (result instanceof ResponseEntity<?> responseEntity) {
            body = responseEntity.getBody();
        }
        
        if (body != null) {
            try {
                Method getUsernameMethod = body.getClass().getMethod("getUsername");
                String username = (String) getUsernameMethod.invoke(body);
                if (username != null) {
                    detailsJson.put("user", username);
                }
            } catch (Exception e) {
                // Ignore
            }
            try {
                Method getNameMethod = body.getClass().getMethod("getName");
                String name = (String) getNameMethod.invoke(body);
                if (name != null) {
                    detailsJson.put("form", name);
                }
            } catch (Exception e) {
                // Ignore
            }
            try {
                Method getIdMethod = body.getClass().getMethod("getId");
                Object id = getIdMethod.invoke(body);
                if (id != null) {
                    detailsJson.put("id", id.toString());
                }
            } catch (Exception e) {
                // Ignore
            }
        }
    }
}
