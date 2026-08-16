package org.springframework.samples.smartcheckin.configuration.jwt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

@SuppressWarnings("null")
class AuthTokenFilterTests {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String VALID_JWT_TOKEN = "validJwtToken";
    private static final String COOKIE_JWT_TOKEN = "cookieJwtToken";

    private JwtUtils jwtUtils;
    private UserDetailsServiceImpl userDetailsService;
    private JwtBlacklistService jwtBlacklistService;
    private AuthTokenFilter authTokenFilter;

    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        jwtUtils = mock(JwtUtils.class);
        userDetailsService = mock(UserDetailsServiceImpl.class);
        jwtBlacklistService = mock(JwtBlacklistService.class);
        authTokenFilter = new AuthTokenFilter(jwtUtils, userDetailsService, jwtBlacklistService);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        filterChain = mock(FilterChain.class);

        SecurityContextHolder.clearContext();
    }

    @Test
    void testDoFilterInternalValidJwt() throws Exception {
        when(request.getHeader(AUTHORIZATION_HEADER)).thenReturn("Bearer " + VALID_JWT_TOKEN);
        when(jwtUtils.validateJwtToken(VALID_JWT_TOKEN)).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted(VALID_JWT_TOKEN)).thenReturn(false);
        when(jwtUtils.getUserNameFromJwtToken(VALID_JWT_TOKEN)).thenReturn("testuser");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalInvalidJwt() throws Exception {
        when(request.getHeader(AUTHORIZATION_HEADER)).thenReturn("Bearer invalidJwtToken");
        when(jwtUtils.validateJwtToken("invalidJwtToken")).thenReturn(false);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalNoHeader() throws Exception {
        when(request.getHeader(AUTHORIZATION_HEADER)).thenReturn(null);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalException() throws Exception {
        when(request.getHeader(AUTHORIZATION_HEADER)).thenReturn("Bearer " + VALID_JWT_TOKEN);
        when(jwtUtils.validateJwtToken(VALID_JWT_TOKEN)).thenThrow(new RuntimeException("Token error"));

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    // --- NUEVOS TESTS DE COBERTURA ---

    @Test
    void testDoFilterInternalBlacklistedJwt() throws Exception {
        when(request.getHeader(AUTHORIZATION_HEADER)).thenReturn("Bearer blacklistedJwtToken");
        when(jwtUtils.validateJwtToken("blacklistedJwtToken")).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted("blacklistedJwtToken")).thenReturn(true);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        // Al estar en la lista negra, no se debe autenticar al usuario y continúa la cadena como anónimo
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalHeaderWithoutBearerPrefix() throws Exception {
        when(request.getHeader(AUTHORIZATION_HEADER)).thenReturn("Basic user:password");

        authTokenFilter.doFilterInternal(request, response, filterChain);

        // No procesa el JWT porque no empieza con "Bearer "
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
        verify(jwtUtils, never()).validateJwtToken(anyString());
    }

    @Test
    void testDoFilterInternalCookieJwt() throws Exception {
        when(jwtUtils.getJwtFromCookies(request)).thenReturn(COOKIE_JWT_TOKEN);
        when(jwtUtils.validateJwtToken(COOKIE_JWT_TOKEN)).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted(COOKIE_JWT_TOKEN)).thenReturn(false);
        when(jwtUtils.getUserNameFromJwtToken(COOKIE_JWT_TOKEN)).thenReturn("cookieUser");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("cookieUser")).thenReturn(userDetails);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testShouldNotFilterAllPaths() {
        assertFalse(authTokenFilter.shouldNotFilter(createRequestWithPath(null)));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/auth/signin")));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/auth/signup")));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/auth/verify-2fa")));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/auth/forgot-password")));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/auth/reset-password")));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/auth/webauthn/login/options")));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/actuator/health")));
        assertTrue(authTokenFilter.shouldNotFilter(createRequestWithPath("/ws/tracker")));
        assertFalse(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/users")));
        assertFalse(authTokenFilter.shouldNotFilter(createRequestWithPath("/api/v1/auth/webauthn/credentials")));
    }

    @Test
    void testAuthTokenFilterWithUserSessionServiceActiveAndInactive() throws Exception {
        org.springframework.samples.smartcheckin.auth.session.UserSessionService sessionService = mock(org.springframework.samples.smartcheckin.auth.session.UserSessionService.class);
        AuthTokenFilter filterWithSession = new AuthTokenFilter(jwtUtils, userDetailsService, jwtBlacklistService, sessionService);

        // Case 1: Inactive session
        when(request.getHeader(AUTHORIZATION_HEADER)).thenReturn("Bearer " + VALID_JWT_TOKEN);
        when(jwtUtils.validateJwtToken(VALID_JWT_TOKEN)).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted(VALID_JWT_TOKEN)).thenReturn(false);
        when(sessionService.isSessionActive(VALID_JWT_TOKEN)).thenReturn(false);

        filterWithSession.doFilterInternal(request, response, filterChain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());

        // Case 2: Active session with X-Forwarded-For
        when(sessionService.isSessionActive(VALID_JWT_TOKEN)).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken(VALID_JWT_TOKEN)).thenReturn("sessionUser");
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("sessionUser")).thenReturn(userDetails);
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.195, 70.41.3.18");
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0");

        filterWithSession.doFilterInternal(request, response, filterChain);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(sessionService).registerOrUpdateSession("sessionUser", VALID_JWT_TOKEN, "203.0.113.195", "Mozilla/5.0");

        // Case 3: Active session without X-Forwarded-For (fallback remoteAddr)
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.50");
        filterWithSession.doFilterInternal(request, response, filterChain);
        verify(sessionService).registerOrUpdateSession("sessionUser", VALID_JWT_TOKEN, "192.168.1.50", "Mozilla/5.0");
    }

    private HttpServletRequest createRequestWithPath(String path) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getServletPath()).thenReturn(path);
        return req;
    }
}