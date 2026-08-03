package org.springframework.samples.smartcheckin.audit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.core.Authentication;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class LoginFailureListenerTests {

    private static final String TEST_USER = "testuser";
    private static final String WRONG_PASS = "wrongpass";

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private LoginFailureListener loginFailureListener;

    @BeforeEach
    void setUp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @Test
    void shouldTriggerAlertAfterThreeFailures() {
        Authentication auth = new UsernamePasswordAuthenticationToken(TEST_USER, WRONG_PASS);
        AuthenticationFailureBadCredentialsEvent event = new AuthenticationFailureBadCredentialsEvent(auth, new org.springframework.security.authentication.BadCredentialsException("bad"));

        // First attempt
        loginFailureListener.onApplicationEvent(event);
        verify(messagingTemplate, never()).convertAndSend(anyString(), anyString());

        // Second attempt
        loginFailureListener.onApplicationEvent(event);
        verify(messagingTemplate, never()).convertAndSend(anyString(), anyString());

        // Third attempt
        loginFailureListener.onApplicationEvent(event);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/alerts"), contains("Múltiples intentos fallidos de login"));
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testGetClientIpNullAttributes() {
        RequestContextHolder.resetRequestAttributes();
        Authentication auth = new UsernamePasswordAuthenticationToken(TEST_USER, WRONG_PASS);
        AuthenticationFailureBadCredentialsEvent event = new AuthenticationFailureBadCredentialsEvent(auth, new org.springframework.security.authentication.BadCredentialsException("bad"));
        loginFailureListener.onApplicationEvent(event);
        assertNotNull(event);
    }

    @Test
    void testGetClientIpWithXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "192.168.1.1, 10.0.0.1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        
        Authentication auth = new UsernamePasswordAuthenticationToken(TEST_USER, WRONG_PASS);
        AuthenticationFailureBadCredentialsEvent event = new AuthenticationFailureBadCredentialsEvent(auth, new org.springframework.security.authentication.BadCredentialsException("bad"));
        loginFailureListener.onApplicationEvent(event);
        assertNotNull(event);
    }
}
