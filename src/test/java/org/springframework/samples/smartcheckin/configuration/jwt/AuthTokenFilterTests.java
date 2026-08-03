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
		when(request.getHeader("Authorization")).thenReturn("Bearer valid_jwt_token");
		when(jwtUtils.validateJwtToken("valid_jwt_token")).thenReturn(true);
		when(jwtUtils.getUserNameFromJwtToken("valid_jwt_token")).thenReturn("testuser");

		UserDetails userDetails = mock(UserDetails.class);
		when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);

		authTokenFilter.doFilterInternal(request, response, filterChain);

		assertNotNull(SecurityContextHolder.getContext().getAuthentication());
		verify(filterChain, times(1)).doFilter(request, response);
	}

	@Test
	void testDoFilterInternalInvalidJwt() throws Exception {
		when(request.getHeader("Authorization")).thenReturn("Bearer invalid_jwt_token");
		when(jwtUtils.validateJwtToken("invalid_jwt_token")).thenReturn(false);

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
		when(request.getHeader("Authorization")).thenReturn("Bearer valid_jwt_token");
		when(jwtUtils.validateJwtToken("valid_jwt_token")).thenThrow(new RuntimeException("Token error"));

		authTokenFilter.doFilterInternal(request, response, filterChain);

		assertNull(SecurityContextHolder.getContext().getAuthentication());
		verify(filterChain, times(1)).doFilter(request, response);
	}
}
