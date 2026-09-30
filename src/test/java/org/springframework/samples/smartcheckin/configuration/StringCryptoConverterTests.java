package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.*;

class StringCryptoConverterTests {

    private static final SecureRandom RANDOM = new SecureRandom();

    private StringCryptoConverter converter;

    @BeforeEach
    void setUp() {
        converter = new StringCryptoConverter();
        EncryptionConfig config = new EncryptionConfig();
        config.setSecret("SuperSecretKey12345678901234567890"); 
    }

    @Test
    void testConvertNulls() {
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    void testEncryptionAndDecryptionFlow() {
        String plainText = "InformacionAltamenteConfidencial123";
        
        String encrypted = converter.convertToDatabaseColumn(plainText);
        
        assertNotNull(encrypted);
        assertTrue(encrypted.startsWith("v1:"), "El string cifrado debe comenzar con el prefijo de versión 'v1:'");
        assertTrue(encrypted.contains(":"), "El string cifrado debe contener un separador ':' para el IV");

        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(plainText, decrypted);
    }

    @Test
    void testLegacyV0DecryptionCompatibility() throws Exception {
        // Simular un registro antiguo cifrado con la clave legacy de 16 bytes y formato "iv:encrypted" (2 partes)
        String plainText = "LegacySecretData_v0";
        String secret = "SuperSecretKey12345678901234567890";
        byte[] legacyKey = new byte[16];
        System.arraycopy(secret.getBytes(StandardCharsets.UTF_8), 0, legacyKey, 0, 16);

        byte[] iv = new byte[12];
        RANDOM.nextBytes(iv);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(legacyKey, "AES"), new GCMParameterSpec(128, iv));
        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        String legacyDbData = Base64.getEncoder().encodeToString(iv) + ":" + Base64.getEncoder().encodeToString(encrypted);

        // El converter debe descifrarlo transparentemente
        String decrypted = converter.convertToEntityAttribute(legacyDbData);
        assertEquals(plainText, decrypted, "Debe descifrar registros legacy v0 de 2 partes sin prefijo de versión");
    }

    @Test
    void testCompatibilityFallback() {
        String unencryptedOldData = "DatosAntiguosSinCifrar";
        assertEquals(unencryptedOldData, converter.convertToEntityAttribute(unencryptedOldData));
    }

    @Test
    void testDecryptionGracefulFallbackForInvalidData() {
        String invalidData = "invalidBase64:invalidBase64";
        assertEquals(invalidData, converter.convertToEntityAttribute(invalidData));
    }

    @Test
    void testSetSecretThrowsOnNull() {
        EncryptionConfig config = new EncryptionConfig();
        assertThrows(IllegalArgumentException.class, () -> config.setSecret(null));
    }

    @Test
    void testSetSecretThrowsOnShortSecret() {
        EncryptionConfig config = new EncryptionConfig();
        assertThrows(IllegalArgumentException.class, () -> config.setSecret("corto"));
    }

    @Test
    void testV1TamperedDataThrowsSecurityException() {
        String tamperedV1Data = "v1:invalidIV:invalidCiphertext";
        assertThrows(SecurityException.class, () -> converter.convertToEntityAttribute(tamperedV1Data));
    }
}