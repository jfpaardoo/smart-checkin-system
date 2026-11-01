package org.springframework.samples.smartcheckin.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.io.StringWriter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

@SuppressWarnings({"null", "java:S100", "java:S1313"})
class RateLimitFilterTests {

    private RateLimitFilter rateLimitFilter;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter();
        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        filterChain = mock(FilterChain.class);
    }

    @Test
    void testRateLimit_StrictEndpoint_ShouldAllowUpTo10Requests() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/signin");
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        // First 10 requests should be allowed
        for (int i = 0; i < 10; i++) {
            rateLimitFilter.doFilterInternal(request, response, filterChain);
        }
        verify(filterChain, times(10)).doFilter(request, response);
        
        // 11th request should be blocked
        rateLimitFilter.doFilterInternal(request, response, filterChain);
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        assertEquals("Too many requests. Please try again later.", stringWriter.toString());
    }

    @Test
    void testRateLimit_SensitiveEndpoints_ShouldApplyStrictLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/verify-2fa");
        when(request.getRemoteAddr()).thenReturn("192.168.1.105");

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        for (int i = 0; i < 10; i++) {
            rateLimitFilter.doFilterInternal(request, response, filterChain);
        }
        verify(filterChain, times(10)).doFilter(request, response);

        rateLimitFilter.doFilterInternal(request, response, filterChain);
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    void testRateLimit_GlobalEndpoint_ShouldAllowMoreThan10Requests() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/users/profile");
        when(request.getRemoteAddr()).thenReturn("192.168.1.101");

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        // First 15 requests should be allowed (limit is 200)
        for (int i = 0; i < 15; i++) {
            rateLimitFilter.doFilterInternal(request, response, filterChain);
        }
        
        verify(filterChain, times(15)).doFilter(request, response);
        verify(response, never()).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    void testRateLimit_XForwardedForWithMultipleIPs() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/checkins/qr-fichaje");
        when(request.getHeader("X-Forwarded-For")).thenReturn("198.51.100.1, 10.0.0.1");

        rateLimitFilter.doFilterInternal(request, response, filterChain);
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testRateLimit_XForwardedForUnknownOrEmptyFallbackToRemoteAddr() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/users");
        when(request.getHeader("X-Forwarded-For")).thenReturn("unknown");
        when(request.getRemoteAddr()).thenReturn("192.168.1.50");

        rateLimitFilter.doFilterInternal(request, response, filterChain);
        verify(filterChain, times(1)).doFilter(request, response);

        when(request.getHeader("X-Forwarded-For")).thenReturn("");
        rateLimitFilter.doFilterInternal(request, response, filterChain);
        verify(filterChain, times(2)).doFilter(request, response);
    }
    @Test
    void testRateLimit_SignupEndpoint_ShouldApplyStrictLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/signup");
        when(request.getRemoteAddr()).thenReturn("192.168.1.110");

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        for (int i = 0; i < 10; i++) {
            rateLimitFilter.doFilterInternal(request, response, filterChain);
        }
        verify(filterChain, times(10)).doFilter(request, response);

        rateLimitFilter.doFilterInternal(request, response, filterChain);
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    void testRateLimit_QrFichaje_PerUserKey_ShouldAllowMultipleUsersOnSameIP() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/checkins/qr-fichaje");
        when(request.getRemoteAddr()).thenReturn("203.0.113.10"); // Same public classroom NAT IP

        org.springframework.security.core.Authentication authUser1 =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("student1", "pass", java.util.Collections.emptyList());
        org.springframework.security.core.Authentication authUser2 =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("student2", "pass", java.util.Collections.emptyList());

        // student1 scans 20 times
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authUser1);
        for (int i = 0; i < 20; i++) {
            rateLimitFilter.doFilterInternal(request, response, filterChain);
        }

        // student2 scans 20 times on same IP without being blocked
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authUser2);
        for (int i = 0; i < 20; i++) {
            rateLimitFilter.doFilterInternal(request, response, filterChain);
        }

        verify(filterChain, times(40)).doFilter(request, response);
        verify(response, never()).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }
}
