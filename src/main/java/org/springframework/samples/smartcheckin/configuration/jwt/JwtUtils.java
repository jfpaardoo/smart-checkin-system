package org.springframework.samples.smartcheckin.configuration.jwt;

import java.util.HashMap;
import java.util.Map;
import java.time.Instant;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.Date;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;

import org.jpatterns.gof.SingletonPattern;

@Component
@SingletonPattern.Singleton
public class JwtUtils {
	private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

	@Value("${badistributionacademy.app.jwtExpirationMs:${smartcheckin.app.jwtExpirationMs:86400000}}")
	private int jwtExpirationMs;

	private KeyPair rsaKeyPair;

	@PostConstruct
	public void initKeys() {
		try {
			KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
			keyPairGenerator.initialize(2048);
			this.rsaKeyPair = keyPairGenerator.generateKeyPair();
			logger.info("RSA Key Pair generated successfully for JWT signing.");
		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("Failed to generate RSA Key Pair", e);
		}
	}

	public String getPublicKeyBase64() {
		RSAPublicKey publicKey = (RSAPublicKey) rsaKeyPair.getPublic();
		return Base64.getEncoder().encodeToString(publicKey.getEncoded());
	}

	public String generateJwtToken(Authentication authentication) {

		UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
		Map<String, Object> claims = new HashMap<>();
		claims.put("authorities",
				userPrincipal.getAuthorities().stream().map(auth -> auth.getAuthority()).toList());

		Instant now = Instant.now();
		return Jwts.builder().setClaims(claims).setSubject((userPrincipal.getUsername())).setIssuedAt(java.util.Date.from(now))
				.setExpiration(java.util.Date.from(now.plusMillis(jwtExpirationMs)))
				.signWith(rsaKeyPair.getPrivate()).compact();
	}

	public String generateTokenFromUsername(String username, Authorities authority) {
		Map<String, Object> claims = new HashMap<>();
		claims.put("authorities", authority.getAuthority());
		Instant now = Instant.now();
		return Jwts.builder().setClaims(claims).setSubject(username).setIssuedAt(java.util.Date.from(now))
				.setExpiration(java.util.Date.from(now.plusMillis(jwtExpirationMs)))
				.signWith(rsaKeyPair.getPrivate()).compact();
	}

	public String getUserNameFromJwtToken(String token) {
		return Jwts.parserBuilder().setSigningKey(rsaKeyPair.getPublic()).build().parseClaimsJws(token).getBody().getSubject();
	}

	public Date getExpirationDateFromJwtToken(String token) {
		return Jwts.parserBuilder().setSigningKey(rsaKeyPair.getPublic()).build().parseClaimsJws(token).getBody().getExpiration();
	}

	public boolean validateJwtToken(String authToken) {
		try {
			Jwts.parserBuilder().setSigningKey(rsaKeyPair.getPublic()).build().parseClaimsJws(authToken);
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
