package org.springframework.samples.smartcheckin.configuration.jwt;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.lang.NonNull;

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
	private final org.springframework.samples.smartcheckin.auth.session.UserSessionService userSessionService;

	public AuthTokenFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService, JwtBlacklistService jwtBlacklistService) {
		this(jwtUtils, userDetailsService, jwtBlacklistService, null);
	}

	public AuthTokenFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService, JwtBlacklistService jwtBlacklistService, org.springframework.samples.smartcheckin.auth.session.UserSessionService userSessionService) {
		this.jwtUtils = jwtUtils;
		this.userDetailsService = userDetailsService;
		this.jwtBlacklistService = jwtBlacklistService;
		this.userSessionService = userSessionService;
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
			throws ServletException, IOException {
		try {
			String jwt = parseJwt(request);
			if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
				if (jwtBlacklistService.isBlacklisted(jwt)) {
					logger.error("JWT token is blacklisted");
					response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has been invalidated (Logged out)");
					return;
				}
				if (userSessionService != null && !userSessionService.isSessionActive(jwt)) {
					logger.error("Session has been revoked remotely");
					response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Session has been revoked remotely");
					return;
				}
				String username = jwtUtils.getUserNameFromJwtToken(jwt);
				UserDetails userDetails = userDetailsService.loadUserByUsername(username);
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
						userDetails, null, userDetails.getAuthorities());
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

				SecurityContextHolder.getContext().setAuthentication(authentication);

				if (userSessionService != null) {
					String clientIp = request.getHeader("X-Forwarded-For") != null ? request.getHeader("X-Forwarded-For").split(",")[0].trim() : request.getRemoteAddr();
					String userAgent = request.getHeader("User-Agent");
					userSessionService.registerOrUpdateSession(username, jwt, clientIp, userAgent);
				}
			}
		} catch (Exception e) {
			logger.error("Cannot set user authentication: {}", e);
		}

		filterChain.doFilter(request, response);
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
