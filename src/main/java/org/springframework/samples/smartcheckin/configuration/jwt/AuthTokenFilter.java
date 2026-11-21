package org.springframework.samples.smartcheckin.configuration.jwt;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.lang.NonNull;

import io.jsonwebtoken.Claims;
import org.springframework.samples.smartcheckin.auth.session.UserSessionService;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

public class AuthTokenFilter extends OncePerRequestFilter {

	private final JwtUtils jwtUtils;
	private final UserDetailsServiceImpl userDetailsService;
	private final JwtBlacklistService jwtBlacklistService;
	private final UserSessionService userSessionService;

	public AuthTokenFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService, JwtBlacklistService jwtBlacklistService) {
		this(jwtUtils, userDetailsService, jwtBlacklistService, null);
	}

	public AuthTokenFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService, JwtBlacklistService jwtBlacklistService, UserSessionService userSessionService) {
		this.jwtUtils = jwtUtils;
		this.userDetailsService = userDetailsService;
		this.jwtBlacklistService = jwtBlacklistService;
		this.userSessionService = userSessionService;
	}

	@Override
	protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
		String path = request.getServletPath();
		if (path == null) return false;
		return path.equals("/api/v1/auth/signin")
				|| path.equals("/api/v1/auth/signup")
				|| path.equals("/api/v1/auth/verify-2fa")
				|| path.equals("/api/v1/auth/forgot-password")
				|| path.equals("/api/v1/auth/reset-password")
				|| path.startsWith("/api/v1/auth/webauthn/login/")
				|| path.equals("/actuator/health")
				|| path.startsWith("/actuator/health/")
				|| path.startsWith("/ws/");
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
			throws ServletException, IOException {
		try {
			String jwt = parseJwt(request);
			if (jwt != null) {
				Claims claims = jwtUtils.validateAndGetClaims(jwt);
				if (claims != null && claims.getSubject() != null) {
					processJwtAuthentication(jwt, claims.getSubject(), request);
				}
			}
		} catch (Exception e) {
			logger.error("Cannot set user authentication: {}", e);
		}

		filterChain.doFilter(request, response);
	}

	private void processJwtAuthentication(String jwt, String username, HttpServletRequest request) {
		boolean blacklisted = jwtBlacklistService != null && jwtBlacklistService.isBlacklisted(jwt);
		boolean sessionInactive = userSessionService != null && !userSessionService.isSessionActive(jwt);

		if (blacklisted || sessionInactive) {
			SecurityContextHolder.clearContext();
			return;
		}

		UserDetails userDetails = userDetailsService.loadUserByUsername(username);
		UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
				userDetails, null, userDetails.getAuthorities());
		authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

		SecurityContextHolder.getContext().setAuthentication(authentication);

		if (userSessionService != null) {
			String clientIp = extractClientIp(request);
			String userAgent = request.getHeader("User-Agent");
			userSessionService.registerOrUpdateSession(username, jwt, clientIp, userAgent);
		}
	}

	private String extractClientIp(HttpServletRequest request) {
		String remoteAddr = request.getRemoteAddr();
		return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "127.0.0.1";
	}

	private String parseJwt(HttpServletRequest request) {
		String cookieJwt = jwtUtils.getJwtFromCookies(request);
		if (cookieJwt != null) {
			return cookieJwt;
		}
		// Fallback: support Authorization: Bearer <token> header (e.g., for tests / API clients)
		String headerAuth = request.getHeader("Authorization");
		if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
			return headerAuth.substring(7);
		}
		return null;
	}

}
