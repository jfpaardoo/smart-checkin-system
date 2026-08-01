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
	}
}
