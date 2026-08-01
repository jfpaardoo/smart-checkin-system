package org.springframework.samples.smartcheckin.totp;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TotpServiceTests {

	private TotpService totpService;

	@BeforeEach
	void setUp() {
		totpService = new TotpService();
		ReflectionTestUtils.setField(totpService, "secret", "TEST_SECRET_KEY_12345");
	}

	@Test
	void testGetCurrentToken() {
		String token = totpService.getCurrentToken();
		assertNotNull(token);
		assertEquals(6, token.length());
	}

	@Test
	void testGetCurrentTokenForFormation() {
		String tokenObj = totpService.getCurrentToken(10);
		assertNotNull(tokenObj);
		assertEquals(6, tokenObj.length());
	}

	@Test
	void testVerifyToken() {
		String currentToken = totpService.getCurrentToken();
		assertTrue(totpService.verifyToken(currentToken));
		assertFalse(totpService.verifyToken("000000"));
		assertFalse(totpService.verifyToken(null));
		assertFalse(totpService.verifyToken(" "));
	}

	@Test
	void testVerifyTokenForFormation() {
		String currentTokenObj = totpService.getCurrentToken(10);
		assertTrue(totpService.verifyToken(currentTokenObj, 10));
		assertFalse(totpService.verifyToken(currentTokenObj, 999));
		assertFalse(totpService.verifyToken(null, 10));
	}

	@Test
	void testValidateCode() {
		assertFalse(totpService.validateCode(null, "123456"));
		assertFalse(totpService.validateCode("SECRET", null));
		assertFalse(totpService.validateCode(" ", "123456"));
	}

	@Test
	void testGetHashedSecretBranches() {
		String tokenNullStr = totpService.getCurrentToken("null");
		assertNotNull(tokenNullStr);

		String tokenEmptyStr = totpService.getCurrentToken("");
		assertNotNull(tokenEmptyStr);

		String tokenStringId = totpService.getCurrentToken("10");
		assertNotNull(tokenStringId);

		assertTrue(totpService.verifyToken(tokenStringId, "10"));
		assertTrue(totpService.verifyToken(tokenNullStr, "null"));
		assertTrue(totpService.verifyToken(tokenEmptyStr, ""));
	}
}
