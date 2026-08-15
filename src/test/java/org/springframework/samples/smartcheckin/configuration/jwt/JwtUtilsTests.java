package org.springframework.samples.smartcheckin.configuration.jwt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.security.KeyPair;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@SuppressWarnings("java:S6466")
class JwtUtilsTests {

	private JwtUtils jwtUtils;

	@BeforeEach
	void setUp() {
		jwtUtils = new JwtUtils();
		ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 86400000);
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
		KeyPair otherKeyPair = Jwts.SIG.RS256.keyPair().build();
		String token = Jwts.builder()
				.subject("test")
				.signWith(otherKeyPair.getPrivate())
				.compact();
		assertFalse(jwtUtils.validateJwtToken(token));
	}

	@Test
	@SuppressWarnings("null")
	void testExpiredJwtException() {
		KeyPair keyPair = (KeyPair) ReflectionTestUtils.getField(jwtUtils, "rsaKeyPair");
		assertNotNull(keyPair);
		String token = io.jsonwebtoken.Jwts.builder()
				.subject("test")
				.issuedAt(Date.from(Instant.now().minusMillis(10000)))
				.expiration(Date.from(Instant.now().minusMillis(5000)))
				.signWith(keyPair.getPrivate())
				.compact();
		assertFalse(jwtUtils.validateJwtToken(token));
	}

	@Test
	@SuppressWarnings("java:S5659")
	void testUnsupportedJwtException() {
		// Unsecured JWT (no signature)
		String token = io.jsonwebtoken.Jwts.builder()
				.subject("test")
				.compact();
		assertFalse(jwtUtils.validateJwtToken(token));
	}

	@Test
    void testGetExpirationDateFromJwtToken() {
        UserDetailsImpl userDetails = new UserDetailsImpl(1, "john", "pass", List.of(new SimpleGrantedAuthority("ADMIN")));
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);

        String token = jwtUtils.generateJwtToken(auth);
        Instant expirationDate = jwtUtils.getExpirationDateFromJwtToken(token);
        
        assertNotNull(expirationDate);
        assertTrue(expirationDate.isAfter(Instant.now()));
    }

	@Test
	void testGenerateJwtCookieAndGetCleanJwtCookie() {
		UserDetailsImpl userDetails = new UserDetailsImpl(1, "john", "pass", List.of(new SimpleGrantedAuthority("ADMIN")));
		Authentication auth = mock(Authentication.class);
		when(auth.getPrincipal()).thenReturn(userDetails);

		ResponseCookie cookie = jwtUtils.generateJwtCookie(auth);
		assertNotNull(cookie);
		assertEquals("jwt", cookie.getName());
		assertNotNull(cookie.getValue());
		assertEquals(86400, cookie.getMaxAge().getSeconds());

		ResponseCookie cleanCookie = jwtUtils.getCleanJwtCookie();
		assertNotNull(cleanCookie);
		assertEquals("jwt", cleanCookie.getName());
		assertEquals("", cleanCookie.getValue());
		assertEquals(0, cleanCookie.getMaxAge().getSeconds());
	}

	@Test
	void testGetJwtFromCookies() {
		HttpServletRequest reqWithCookie = mock(HttpServletRequest.class);
		Cookie cookie = new Cookie("jwt", "sampleTokenValue");
		when(reqWithCookie.getCookies()).thenReturn(new Cookie[]{cookie});

		assertEquals("sampleTokenValue", jwtUtils.getJwtFromCookies(reqWithCookie));

		HttpServletRequest reqWithoutCookie = mock(HttpServletRequest.class);
		when(reqWithoutCookie.getCookies()).thenReturn(null);

		assertNull(jwtUtils.getJwtFromCookies(reqWithoutCookie));
	}

	@Test
	void testMalformedJwtException() {
		assertFalse(jwtUtils.validateJwtToken("not.a.valid.jwt.structure"));
	}

	@Test
	void testGenericExceptionBranchInValidate() {
		// Mock parseSignedClaims to throw an unexpected RuntimeException
		JwtUtils spyUtils = spy(jwtUtils);
		doThrow(new RuntimeException("Unexpected error")).when(spyUtils).getUserNameFromJwtToken(anyString());
		
		assertFalse(spyUtils.validateJwtToken("someToken"));
	}
}

