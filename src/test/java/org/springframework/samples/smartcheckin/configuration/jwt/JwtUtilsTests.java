package org.springframework.samples.smartcheckin.configuration.jwt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

class JwtUtilsTests {

	private JwtUtils jwtUtils;

	@BeforeEach
	void setUp() {
		jwtUtils = new JwtUtils();
		ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 86400000);
		jwtUtils.initKeys();
	}

	@Test
	void testGetPublicKeyBase64() {
		String pubKey = jwtUtils.getPublicKeyBase64();
		assertNotNull(pubKey);
		assertFalse(pubKey.isEmpty());
	}

	@Test
	void testGenerateJwtTokenAndValidate() {
		UserDetailsImpl userDetails = new UserDetailsImpl(1, "john", "pass", List.of(new SimpleGrantedAuthority("ADMIN")));
		Authentication auth = mock(Authentication.class);
		when(auth.getPrincipal()).thenReturn(userDetails);

		String token = jwtUtils.generateJwtToken(auth);
		assertNotNull(token);
		assertTrue(jwtUtils.validateJwtToken(token));
		assertEquals("john", jwtUtils.getUserNameFromJwtToken(token));
	}

	@Test
	void testGenerateTokenFromUsername() {
		Authorities authority = new Authorities();
		authority.setAuthority("EMPLOYEE");

		String token = jwtUtils.generateTokenFromUsername("alice", authority);
		assertNotNull(token);
		assertTrue(jwtUtils.validateJwtToken(token));
		assertEquals("alice", jwtUtils.getUserNameFromJwtToken(token));
	}

	@Test
	void testValidateInvalidJwtToken() {
		assertFalse(jwtUtils.validateJwtToken("invalid.jwt.token"));
		assertFalse(jwtUtils.validateJwtToken(""));
		assertFalse(jwtUtils.validateJwtToken(null)); // IllegalArgumentException
	}

	@Test
	void testSignatureException() {
		// Generate a token with a different key
		io.jsonwebtoken.security.Keys.keyPairFor(io.jsonwebtoken.SignatureAlgorithm.RS256);
		java.security.KeyPair otherKeyPair = io.jsonwebtoken.security.Keys.keyPairFor(io.jsonwebtoken.SignatureAlgorithm.RS256);
		String token = io.jsonwebtoken.Jwts.builder()
				.setSubject("test")
				.signWith(otherKeyPair.getPrivate(), io.jsonwebtoken.SignatureAlgorithm.RS256)
				.compact();
		assertFalse(jwtUtils.validateJwtToken(token));
	}

	@Test
	@SuppressWarnings("null")
	void testExpiredJwtException() {
		java.security.KeyPair keyPair = (java.security.KeyPair) ReflectionTestUtils.getField(jwtUtils, "rsaKeyPair");
		assertNotNull(keyPair);
		String token = io.jsonwebtoken.Jwts.builder()
				.setSubject("test")
				.setIssuedAt(new java.util.Date(System.currentTimeMillis() - 10000))
				.setExpiration(new java.util.Date(System.currentTimeMillis() - 5000))
				.signWith(keyPair.getPrivate(), io.jsonwebtoken.SignatureAlgorithm.RS256)
				.compact();
		assertFalse(jwtUtils.validateJwtToken(token));
	}

	@Test
	void testUnsupportedJwtException() {
		// Unsecured JWT (no signature)
		String token = io.jsonwebtoken.Jwts.builder()
				.setSubject("test")
				.compact();
		assertFalse(jwtUtils.validateJwtToken(token));
	}

	@Test
	void testInitKeysNoSuchAlgorithmException() {
		try (org.mockito.MockedStatic<java.security.KeyPairGenerator> mockedStatic = mockStatic(java.security.KeyPairGenerator.class)) {
			mockedStatic.when(() -> java.security.KeyPairGenerator.getInstance("RSA"))
					.thenThrow(new java.security.NoSuchAlgorithmException("RSA not found"));
			
			RuntimeException exception = assertThrows(RuntimeException.class, () -> jwtUtils.initKeys());
			assertTrue(exception.getMessage().contains("Failed to generate RSA Key Pair"));
		}
	}
}
