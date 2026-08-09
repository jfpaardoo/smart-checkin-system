package org.springframework.samples.smartcheckin.audit;

import static org.mockito.Mockito.*;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;
import org.aspectj.lang.Signature;
import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@SuppressWarnings({"null", "unused"})
class AuditAspectTests {

    private static final String DUMMY_STRING = "String";

    private AuditLogRepository auditLogRepository;
    private AuditAspect aspect;

    @BeforeEach
    void setUp() {
        auditLogRepository = mock(AuditLogRepository.class);
        SimpMessagingTemplate messagingTemplate = mock(SimpMessagingTemplate.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        aspect = new AuditAspect(auditLogRepository, request, messagingTemplate);

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("testuser");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testLogUserSave() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        
        class DummyUser {
            public String getUsername() { return "john_doe"; }
        }
        
        aspect.logUserSave(joinPoint, new DummyUser());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogFormationSave() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        class DummyFormation {
            public String getName() { return "Math Course"; }
        }

        aspect.logFormationSave(joinPoint, new DummyFormation());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogFormationDelete() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"123"});

        aspect.logFormationDelete(joinPoint);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogCheckIn() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logCheckIn(joinPoint, new Object());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogCheckOut() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logCheckOut(joinPoint, new Object());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogAuditNullAuth() {
        SecurityContextHolder.clearContext();
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logCheckIn(joinPoint, new Object());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogUserSaveNullResult() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logUserSave(joinPoint, null);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogUserSaveException() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logUserSave(joinPoint, new Object());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogFormationSaveNullResult() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logFormationSave(joinPoint, null);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogFormationSaveException() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logFormationSave(joinPoint, new Object());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogFormationDeleteNoArgs() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{});
        aspect.logFormationDelete(joinPoint);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogLoginSuccess() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        JwtResponse jwtResponse = new JwtResponse("token", 1L, "user", List.of());
        jwtResponse.setRequiresTwoFactor(false);
        ResponseEntity<Object> responseEntity = ResponseEntity.ok(jwtResponse);
        aspect.logLoginSuccess(joinPoint, responseEntity);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogLoginSuccessRequires2FA() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        JwtResponse jwtResponse = new JwtResponse();
        jwtResponse.setRequiresTwoFactor(true);
        ResponseEntity<Object> responseEntity = ResponseEntity.ok(jwtResponse);
        aspect.logLoginSuccess(joinPoint, responseEntity);
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogTwoFactorLoginSuccess() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logTwoFactorLoginSuccess(joinPoint, ResponseEntity.ok().build());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogPasswordChange() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logPasswordChange(joinPoint, ResponseEntity.ok().build());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogTwoFactorEnable() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logTwoFactorEnable(joinPoint, ResponseEntity.ok().build());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogTwoFactorDisable() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logTwoFactorDisable(joinPoint, ResponseEntity.ok().build());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogUserDelete() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"999"});
        aspect.logUserDelete(joinPoint);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogDataExport() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        Signature signature = mock(Signature.class);
        when(signature.getName()).thenReturn("exportUsersCsv");
        when(joinPoint.getSignature()).thenReturn(signature);
        aspect.logDataExport(joinPoint, ResponseEntity.ok().build());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogDatabaseBackup() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logDatabaseBackup(joinPoint);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogAuditAuthNotNullButNameNull() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(null); // Fuerza rama nombre nulo
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logCheckIn(joinPoint, new Object());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogLoginSuccessNotResponseEntity() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logLoginSuccess(joinPoint, "Not a response entity");
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogLoginSuccessNot2xx() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        ResponseEntity<Object> responseEntity = ResponseEntity.status(400).build();
        aspect.logLoginSuccess(joinPoint, responseEntity);
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogLoginSuccessBodyNotJwtResponse() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        ResponseEntity<String> responseEntity = ResponseEntity.ok("Just a string");
        aspect.logLoginSuccess(joinPoint, responseEntity);
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }
    
    @Test
    void testLogLoginSuccessRequiresTwoFactorNull() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        JwtResponse jwtResponse = mock(JwtResponse.class);
        when(jwtResponse.getRequiresTwoFactor()).thenReturn(null); // Fuerza rama flag nulo
        ResponseEntity<Object> responseEntity = ResponseEntity.ok(jwtResponse);
        aspect.logLoginSuccess(joinPoint, responseEntity);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogTwoFactorLoginSuccessNotResponseEntityOrNot2xx() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logTwoFactorLoginSuccess(joinPoint, DUMMY_STRING);
        aspect.logTwoFactorLoginSuccess(joinPoint, ResponseEntity.badRequest().build());
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogPasswordChangeNotResponseEntityOrNot2xx() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logPasswordChange(joinPoint, DUMMY_STRING);
        aspect.logPasswordChange(joinPoint, ResponseEntity.badRequest().build());
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogTwoFactorEnableNotResponseEntityOrNot2xx() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logTwoFactorEnable(joinPoint, DUMMY_STRING);
        aspect.logTwoFactorEnable(joinPoint, ResponseEntity.badRequest().build());
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogTwoFactorDisableNotResponseEntityOrNot2xx() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logTwoFactorDisable(joinPoint, DUMMY_STRING);
        aspect.logTwoFactorDisable(joinPoint, ResponseEntity.badRequest().build());
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogDataExportNotResponseEntityOrNot2xx() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        aspect.logDataExport(joinPoint, DUMMY_STRING);
        aspect.logDataExport(joinPoint, ResponseEntity.badRequest().build());
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogUserDeleteNoArgs() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{}); // Fuerza rama args vacíos
        aspect.logUserDelete(joinPoint);
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }
}