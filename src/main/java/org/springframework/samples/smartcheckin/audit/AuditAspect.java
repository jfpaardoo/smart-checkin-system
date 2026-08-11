package org.springframework.samples.smartcheckin.audit;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Aspect
@Component
public class AuditAspect {

    private static final String UNKNOWN_ID = "unknown";
    private static final String CHECKIN_SUCCESS_ACTION = "CHECKIN_SUCCESS";

    private final AuditLogRepository auditLogRepository;
    private final HttpServletRequest request;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public AuditAspect(AuditLogRepository auditLogRepository, HttpServletRequest request, SimpMessagingTemplate messagingTemplate) {
        this.auditLogRepository = auditLogRepository;
        this.request = request;
        this.messagingTemplate = messagingTemplate;
    }

    private void logAudit(String action, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";
        String ipAddress = "127.0.0.1";
        try {
            if (request != null && request.getRemoteAddr() != null) {
                ipAddress = request.getRemoteAddr();
            }
        } catch (Exception e) {
            // Request scope not active (e.g. background/async thread)
        }

        AuditLog log = new AuditLog(action, username, details, ipAddress);
        auditLogRepository.save(log);
        messagingTemplate.convertAndSend("/topic/audit", "NEW_LOG");
    }

    // Intercept user creation (Admin)
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.create(..))", returning = "result")
    public void logUserCreate(JoinPoint joinPoint, Object result) {
        String details = "Admin created user";
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            Object body = responseEntity.getBody();
            if (body != null) {
                try {
                    java.lang.reflect.Method getUsernameMethod = body.getClass().getMethod("getUsername");
                    String username = (String) getUsernameMethod.invoke(body);
                    details += ": " + username;
                } catch (Exception e) {
                    // Ignore
                }
            }
            logAudit("USER_CREATE", details);
        }
    }

    // Intercept user update (Admin)
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.update(..))", returning = "result")
    public void logUserUpdate(JoinPoint joinPoint, Object result) {
        String details = "Admin updated user";
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            Object body = responseEntity.getBody();
            if (body != null) {
                try {
                    java.lang.reflect.Method getUsernameMethod = body.getClass().getMethod("getUsername");
                    String username = (String) getUsernameMethod.invoke(body);
                    details += ": " + username;
                } catch (Exception e) {
                    // Ignore
                }
            }
            logAudit("USER_UPDATE", details);
        }
    }

    // Intercept user profile update (Self)
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.updateMyProfile(..))", returning = "result")
    public void logUserProfileUpdate(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("USER_UPDATE_PREFS", "User updated their profile preferences");
        }
    }

    // Intercept user approval (Admin)
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.approveUser(..))", returning = "result")
    public void logUserApprove(JoinPoint joinPoint, Object result) {
        Object[] args = joinPoint.getArgs();
        String userId = args.length > 0 ? args[0].toString() : UNKNOWN_ID;
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("USER_APPROVE", "Admin approved user ID: " + userId);
        }
    }

    // Intercept formation creation
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.formation.FormationService.saveFormation(..))", returning = "result")
    public void logFormationSave(JoinPoint joinPoint, Object result) {
        String details = "Formation created/updated";
        if (result != null) {
            try {
                java.lang.reflect.Method getNameMethod = result.getClass().getMethod("getName");
                String name = (String) getNameMethod.invoke(result);
                details += ": " + name;
            } catch (Exception e) {
                // Ignore
            }
        }
        logAudit("FORMATION_SAVE", details);
    }

    // Intercept formation attendance (Checkin)
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.formation.FormationService.registerAttendance(..))", returning = "result")
    public void logFormationAttendance(JoinPoint joinPoint, Object result) {
        Object[] args = joinPoint.getArgs();
        String formationId = args.length > 0 ? args[0].toString() : UNKNOWN_ID;
        logAudit("CHECKIN_FORMATION", "User checked into formation ID: " + formationId);
    }

    // Intercept formation deletion
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.formation.FormationService.deleteFormation(..))")
    public void logFormationDelete(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        String formationId = args.length > 0 ? args[0].toString() : UNKNOWN_ID;
        logAudit("FORMATION_DELETE", "Formation deleted: ID " + formationId);
    }
    
    // Intercept global checkin (ENTRADA / SALIDA)
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.checkin.CheckinService.performCheckIn(..))", returning = "result")
    public void logPerformCheckIn(JoinPoint joinPoint, Object result) {
        if (result != null) {
            try {
                java.lang.reflect.Method getTypeMethod = result.getClass().getMethod("getType");
                Object typeObj = getTypeMethod.invoke(result);
                String typeStr = (typeObj != null) ? typeObj.toString() : "UNKNOWN";
                
                if ("ENTRADA".equalsIgnoreCase(typeStr)) {
                    logAudit(CHECKIN_SUCCESS_ACTION, "User successfully checked in");
                } else if ("SALIDA".equalsIgnoreCase(typeStr)) {
                    logAudit("CHECKOUT_SUCCESS", "User successfully checked out with signature");
                } else {
                    logAudit(CHECKIN_SUCCESS_ACTION, "User checked in/out");
                }
            } catch (Exception e) {
                logAudit(CHECKIN_SUCCESS_ACTION, "User successfully checked in");
            }
        }
    }

    // Intercept successful logins
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.auth.AuthController.authenticateUser(..))", returning = "result")
    public void logLoginSuccess(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            Object body = responseEntity.getBody();
            if (body instanceof JwtResponse jwtResponse && !Boolean.TRUE.equals(jwtResponse.getRequiresTwoFactor())) {
                logAudit("LOGIN_SUCCESS", "User logged in successfully");
            }
        }
    }

    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.auth.AuthController.verifyTwoFactor(..))", returning = "result")
    public void logTwoFactorLoginSuccess(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("LOGIN_SUCCESS", "User logged in successfully using 2FA");
        }
    }

    // Intercept password changes
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.changePassword(..))", returning = "result")
    public void logPasswordChange(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("PASSWORD_CHANGE", "User changed their password");
        }
    }

    // Intercept 2FA enable
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.enableTwoFactor(..))", returning = "result")
    public void logTwoFactorEnable(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("2FA_ENABLE", "User enabled Two-Factor Authentication");
        }
    }

    // Intercept 2FA disable
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.disableTwoFactor(..))", returning = "result")
    public void logTwoFactorDisable(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("2FA_DISABLE", "User disabled Two-Factor Authentication");
        }
    }

    // Intercept 2FA setup initiation
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserRestController.setupTwoFactor(..))", returning = "result")
    public void logTwoFactorSetup(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("2FA_SETUP_INIT", "User initiated 2FA setup");
        }
    }

    // Intercept 2FA code email sending
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.auth.AuthController.generateLoginTwoFactorCode(..))", returning = "result")
    public void logTwoFactorCodeEmail(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            logAudit("2FA_CODE_SENT", "2FA verification code sent to user");
        }
    }

    // Intercept user deletion
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserService.deleteUser(..))")
    public void logUserDelete(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        String userId = args.length > 0 ? args[0].toString() : UNKNOWN_ID;
        logAudit("USER_DELETE", "User deleted: ID " + userId);
    }

    // Intercept data exports
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.exports.ExportRestController.*(..)) || execution(* org.springframework.samples.smartcheckin.audit.AuditController.exportAuditCsv(..))", returning = "result")
    public void logDataExport(JoinPoint joinPoint, Object result) {
        if (result instanceof ResponseEntity<?> responseEntity && responseEntity.getStatusCode().is2xxSuccessful()) {
            String methodName = joinPoint.getSignature().getName();
            logAudit("DATA_EXPORT", "Data exported via method: " + methodName);
        }
    }

    // Intercept Database backup
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.settings.DatabaseBackupService.triggerBackup(..))")
    public void logDatabaseBackup(JoinPoint joinPoint) {
        logAudit("DATA_EXPORT", "Database backup triggered");
    }
}
