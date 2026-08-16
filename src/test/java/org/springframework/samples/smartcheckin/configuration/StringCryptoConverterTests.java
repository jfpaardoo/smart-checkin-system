package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StringCryptoConverterTests {

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
        assertTrue(encrypted.contains(":"), "El string cifrado debe contener un separador ':' para el IV");

        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(plainText, decrypted);
    }

    @Test
    void testCompatibilityFallback() {
        String unencryptedOldData = "DatosAntiguosSinCifrar";
        assertEquals(unencryptedOldData, converter.convertToEntityAttribute(unencryptedOldData));
    }

    @Test
    void testDecryptionExceptionForInvalidBase64() {
        assertThrows(RuntimeException.class, () -> converter.convertToEntityAttribute("invalidBase64:invalidBase64"));
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
}