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
        when(request.getHeader("Authorization")).thenReturn("Bearer validJwtToken");
        when(jwtUtils.validateJwtToken("validJwtToken")).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted("validJwtToken")).thenReturn(false);
        when(jwtUtils.getUserNameFromJwtToken("validJwtToken")).thenReturn("testuser");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalInvalidJwt() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalidJwtToken");
        when(jwtUtils.validateJwtToken("invalidJwtToken")).thenReturn(false);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalNoHeader() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalException() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer validJwtToken");
        when(jwtUtils.validateJwtToken("validJwtToken")).thenThrow(new RuntimeException("Token error"));

        authTokenFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    // --- NUEVOS TESTS DE COBERTURA ---

    @Test
    void testDoFilterInternalBlacklistedJwt() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer blacklistedJwtToken");
        when(jwtUtils.validateJwtToken("blacklistedJwtToken")).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted("blacklistedJwtToken")).thenReturn(true);

        authTokenFilter.doFilterInternal(request, response, filterChain);

        // Al estar en la lista negra, no se debe autenticar al usuario
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        
        // Se debe verificar que se llama al método sendError con código 401
        verify(response, times(1)).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has been invalidated (Logged out)");
        
        // El filterChain.doFilter NUNCA debe llamarse porque se ejecuta un 'return' temprano
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testDoFilterInternalHeaderWithoutBearerPrefix() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Basic user:password");

        authTokenFilter.doFilterInternal(request, response, filterChain);

        // No procesa el JWT porque no empieza con "Bearer "
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
        verify(jwtUtils, never()).validateJwtToken(anyString());
    }
}