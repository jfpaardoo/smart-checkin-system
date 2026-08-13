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

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.lang.annotation.Annotation;

@SuppressWarnings("null")
class AuditAspectTests {

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

    private Auditable createAuditable(String action, String details) {
        return new Auditable() {
            @Override
            public Class<? extends Annotation> annotationType() {
                return Auditable.class;
            }

            @Override
            public String action() {
                return action;
            }

            @Override
            public String details() {
                return details;
            }
        };
    }

    @Test
    void testLogAuditableActionSuccess() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        Auditable auditable = createAuditable("TEST_ACTION", "Test Details");
        ResponseEntity<Object> responseEntity = ResponseEntity.ok().build();
        
        aspect.logAuditableAction(joinPoint, auditable, responseEntity);
        
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogAuditableActionFailureResponse() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        Auditable auditable = createAuditable("TEST_ACTION", "Test Details");
        ResponseEntity<Object> responseEntity = ResponseEntity.badRequest().build();
        
        aspect.logAuditableAction(joinPoint, auditable, responseEntity);
        
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void testLogAuditableActionWithBodyUsername() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        Auditable auditable = createAuditable("TEST_ACTION", "Test Details");
        
        class DummyBody {
            @SuppressWarnings("unused")
            public String getUsername() { return "john_doe"; }
        }
        
        ResponseEntity<Object> responseEntity = ResponseEntity.ok(new DummyBody());
        
        aspect.logAuditableAction(joinPoint, auditable, responseEntity);
        
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogAuditableActionNullAuth() {
        SecurityContextHolder.clearContext();
        JoinPoint joinPoint = mock(JoinPoint.class);
        Auditable auditable = createAuditable("TEST_ACTION", "Test Details");
        
        aspect.logAuditableAction(joinPoint, auditable, "Some Result");
        
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogAuditableActionWithBodyNameAndIdAndEmptyDetails() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        Auditable auditable = createAuditable("TEST_ACTION", "");
        
        class FullEntity {
            @SuppressWarnings("unused")
            public String getName() { return "Formation Alpha"; }
            @SuppressWarnings("unused")
            public Long getId() { return 42L; }
        }
        
        aspect.logAuditableAction(joinPoint, auditable, new FullEntity());
        
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testLogAuditableActionRequestThrowsException() {
        HttpServletRequest throwingRequest = mock(HttpServletRequest.class);
        when(throwingRequest.getRemoteAddr()).thenThrow(new IllegalStateException("No request bound"));
        
        AuditAspect throwingAspect = new AuditAspect(auditLogRepository, throwingRequest, mock(SimpMessagingTemplate.class));
        JoinPoint joinPoint = mock(JoinPoint.class);
        Auditable auditable = createAuditable("TEST_ACTION", "");
        
        throwingAspect.logAuditableAction(joinPoint, auditable, null);
        
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }
}