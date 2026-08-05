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
}
