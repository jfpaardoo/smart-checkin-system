package org.springframework.samples.smartcheckin.audit;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final HttpServletRequest request;

    @Autowired
    public AuditAspect(AuditLogRepository auditLogRepository, HttpServletRequest request) {
        this.auditLogRepository = auditLogRepository;
        this.request = request;
    }

    private void logAudit(String action, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";
        String ipAddress = request.getRemoteAddr();

        AuditLog log = new AuditLog(action, username, details, ipAddress);
        auditLogRepository.save(log);
    }

    // Intercept user creation/update
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.user.UserService.saveUser(..))", returning = "result")
    public void logUserSave(JoinPoint joinPoint, Object result) {
        String details = "User saved/updated";
        if (result != null) {
            try {
                java.lang.reflect.Method getUsernameMethod = result.getClass().getMethod("getUsername");
                String username = (String) getUsernameMethod.invoke(result);
                details += ": " + username;
            } catch (Exception e) {
                details += ": " + result.toString();
            }
        }
        logAudit("USER_SAVE", details);
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

    // Intercept formation deletion
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.formation.FormationService.deleteFormation(..))")
    public void logFormationDelete(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        String formationId = args.length > 0 ? args[0].toString() : "unknown";
        logAudit("FORMATION_DELETE", "Formation deleted: ID " + formationId);
    }
    
    // Intercept TOTP verification (Checkin)
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.checkin.CheckinService.verifyTotpAndCheckIn(..))", returning = "result")
    public void logCheckIn(JoinPoint joinPoint, Object result) {
        logAudit("CHECKIN_SUCCESS", "User successfully checked in");
    }
    
    // Intercept sign-out
    @AfterReturning(pointcut = "execution(* org.springframework.samples.smartcheckin.checkin.CheckinService.checkOut(..))", returning = "result")
    public void logCheckOut(JoinPoint joinPoint, Object result) {
        logAudit("CHECKOUT_SUCCESS", "User successfully checked out with signature");
    }
}
