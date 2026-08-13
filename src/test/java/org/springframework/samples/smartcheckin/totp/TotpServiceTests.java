package org.springframework.samples.smartcheckin.totp;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.exceptions.CodeGenerationException;

@SuppressWarnings("null")
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

	@Test
    void testGetHashedSecretForFormation_NoSuchAlgorithmException() {
        // Añadir Mockito.CALLS_REAL_METHODS evita corromper la generación interna del TOTP
        try (MockedStatic<MessageDigest> mockedDigest = Mockito.mockStatic(MessageDigest.class, Mockito.CALLS_REAL_METHODS)) {
            mockedDigest.when(() -> MessageDigest.getInstance("SHA-256"))
                    .thenThrow(new NoSuchAlgorithmException("Algoritmo simulado no encontrado"));

            // El bloque catch debería hacer un fallback codificando en Base32 directo sin hashear
            String token = totpService.getCurrentToken();
            assertNotNull(token);
            assertEquals(6, token.length());
        }
    }

    @Test
    void testGetCurrentToken_CodeGeneratorException() {
        // Inyectamos un generador defectuoso para forzar la excepción al generar el código
        CodeGenerator brokenGenerator = mock(CodeGenerator.class);
        
        try {
            when(brokenGenerator.generate(anyString(), anyLong()))
                    .thenThrow(new CodeGenerationException("Error forzado", new RuntimeException()));
        } catch (CodeGenerationException e) {
            // No hacemos nada, es solo configuración del mock
        }

        ReflectionTestUtils.setField(totpService, "codeGenerator", brokenGenerator);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            totpService.getCurrentToken();
        });

        assertTrue(ex.getMessage().contains("Error generating TOTP token"));
    }

	@Test
    void shouldValidateCodeSuccessfully() {
        String secretKey = "TEST_SECRET_KEY_12345";
        
        dev.samstevens.totp.time.TimeProvider timeProvider = new dev.samstevens.totp.time.SystemTimeProvider();
        long currentBucket = Math.floorDiv(timeProvider.getTime(), 30);
        
        dev.samstevens.totp.code.CodeGenerator codeGenerator = new dev.samstevens.totp.code.DefaultCodeGenerator();
        
        String validToken = org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> 
            codeGenerator.generate(secretKey, currentBucket)
        );
        
        boolean isValid = totpService.validateCode(secretKey, validToken);
        assertTrue(isValid);
    }

    @Test
    void shouldFailValidateCodeWithInvalidFormatOrEmpty() {
        assertFalse(totpService.validateCode("SECRET", ""));
        assertFalse(totpService.validateCode("   ", "123456"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // generateCode
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void generateCode_nullSecret_returnsNull() {
        assertNull(totpService.generateCode(null));
    }

    @Test
    void generateCode_blankSecret_returnsNull() {
        assertNull(totpService.generateCode("   "));
    }

    @Test
    void generateCode_emptySecret_returnsNull() {
        assertNull(totpService.generateCode(""));
    }

    @Test
    void generateCode_validSecret_returns6DigitToken() {
        String secret = "TEST_SECRET_KEY_12345";
        String code = totpService.generateCode(secret);
        assertNotNull(code);
        assertEquals(6, code.length());
    }

    @Test
    void generateCode_brokenGenerator_throwsRuntimeException() {
        dev.samstevens.totp.code.CodeGenerator brokenGenerator = mock(dev.samstevens.totp.code.CodeGenerator.class);
        try {
            when(brokenGenerator.generate(anyString(), anyLong()))
                    .thenThrow(new dev.samstevens.totp.exceptions.CodeGenerationException("Error", new RuntimeException()));
        } catch (dev.samstevens.totp.exceptions.CodeGenerationException e) {
            // setup only
        }
        ReflectionTestUtils.setField(totpService, "codeGenerator", brokenGenerator);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> totpService.generateCode("SOME_SECRET"));
        assertTrue(ex.getMessage().contains("Error generating TOTP token for secret"));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // cacheAdminLocation & getCachedAdminLocation
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void cacheAdminLocation_nullLat_doesNotCache() {
        totpService.cacheAdminLocation(1, null, 10.0);
        assertNull(totpService.getCachedAdminLocation(1));
    }

    @Test
    void cacheAdminLocation_nullLng_doesNotCache() {
        totpService.cacheAdminLocation(2, 40.0, null);
        assertNull(totpService.getCachedAdminLocation(2));
    }

    @Test
    void cacheAdminLocation_bothNull_doesNotCache() {
        totpService.cacheAdminLocation(3, null, null);
        assertNull(totpService.getCachedAdminLocation(3));
    }

    @Test
    void cacheAdminLocation_validCoords_cachedSuccessfully() {
        totpService.cacheAdminLocation(10, 40.416775, -3.703790);
        double[] cached = totpService.getCachedAdminLocation(10);
        assertNotNull(cached);
        assertEquals(40.416775, cached[0], 0.000001);
        assertEquals(-3.703790, cached[1], 0.000001);
    }

    @Test
    void cacheAdminLocation_nullFormationId_usesGlobalKey() {
        totpService.cacheAdminLocation(null, 51.5074, -0.1278);
        double[] cached = totpService.getCachedAdminLocation(null);
        assertNotNull(cached);
        assertEquals(51.5074, cached[0], 0.000001);
    }

    @Test
    void getCachedAdminLocation_nonExistentKey_returnsNull() {
        assertNull(totpService.getCachedAdminLocation(999999));
    }

    @Test
    void getCachedAdminLocation_nullFormationId_usesGlobalKeyAndReturnsNull() {
        // No entry cached under GLOBAL yet (fresh service)
        // Confirm it doesn't throw and returns null when not found
        TotpService fresh = new TotpService();
        ReflectionTestUtils.setField(fresh, "secret", "TEST_SECRET_KEY_12345");
        assertNull(fresh.getCachedAdminLocation(null));
    }

    @Test
    void getCachedAdminLocation_afterCache_returnsCorrectValues() {
        totpService.cacheAdminLocation("FORM_99", 48.8566, 2.3522);
        double[] result = totpService.getCachedAdminLocation("FORM_99");
        assertNotNull(result);
        assertEquals(2, result.length);
        assertEquals(48.8566, result[0], 0.0001);
        assertEquals(2.3522, result[1], 0.0001);
    }
}
