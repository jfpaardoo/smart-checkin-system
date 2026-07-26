package org.springframework.samples.petclinic.configuration.jwt;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.samples.petclinic.configuration.services.UserDetailsImpl;
import org.springframework.samples.petclinic.user.Authorities;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import java.security.Key;

@Component
@SuppressWarnings("java:S2143") // JJWT requires java.util.Date
public class JwtUtils {
	private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

	@Value("${petclinic.app.jwtSecret}")
	private String jwtSecret;

	@Value("${petclinic.app.jwtExpirationMs}")
	private int jwtExpirationMs;

	private Key getSigningKey() {
		return Keys.hmacShaKeyFor(jwtSecret.getBytes());
	}

	public String generateJwtToken(Authentication authentication) {

		UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
		Map<String, Object> claims = new HashMap<>();
		claims.put("authorities",
				userPrincipal.getAuthorities().stream().map(auth -> auth.getAuthority()).toList());

		Instant now = Instant.now();
		return Jwts.builder().setClaims(claims).setSubject((userPrincipal.getUsername())).setIssuedAt(Date.from(now))
				.setExpiration(Date.from(now.plusMillis(jwtExpirationMs)))
				.signWith(getSigningKey()).compact();
	}

	public String generateTokenFromUsername(String username, Authorities authority) {
		Map<String, Object> claims = new HashMap<>();
		claims.put("authorities", authority.getAuthority());
		Instant now = Instant.now();
		return Jwts.builder().setClaims(claims).setSubject(username).setIssuedAt(Date.from(now))
				.setExpiration(Date.from(now.plusMillis(jwtExpirationMs)))
				.signWith(getSigningKey()).compact();
	}

	public String getUserNameFromJwtToken(String token) {
		return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody().getSubject();
	}

	public boolean validateJwtToken(String authToken) {
		try {
			Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
			return true;
		} catch (SignatureException e) {
			logger.error("Invalid JWT signature: {}", e.getMessage());
		} catch (MalformedJwtException e) {
			logger.error("Invalid JWT token: {}", e.getMessage());
		} catch (ExpiredJwtException e) {
			logger.error("JWT token is expired: {}", e.getMessage());
		} catch (UnsupportedJwtException e) {
			logger.error("JWT token is unsupported: {}", e.getMessage());
		} catch (IllegalArgumentException e) {
			logger.error("JWT claims string is empty: {}", e.getMessage());
		}

		return false;
	}
}
