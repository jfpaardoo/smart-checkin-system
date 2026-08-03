package org.springframework.samples.smartcheckin.configuration;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

@Component
@Converter
public class StringCryptoConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private byte[] getKey() {
        String secret = EncryptionConfig.getSecret();
        if (secret == null || secret.length() < 16) {
            secret = "SuperSecretKey12345678901234567890";
        }
        byte[] key = new byte[16];
        System.arraycopy(secret.getBytes(StandardCharsets.UTF_8), 0, key, 0, 16);
        return key;
    }

    @Override
    public String convertToDatabaseColumn(String data) {
        if (data == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            byte[] iv = new byte[GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(iv);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(getKey(), "AES"), parameterSpec);
            byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            String ivString = Base64.getEncoder().encodeToString(iv);
            String encryptedString = Base64.getEncoder().encodeToString(encrypted);
            
            return ivString + ":" + encryptedString;
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting data", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            String[] parts = dbData.split(":");
            if (parts.length != 2) {
                // Compatibility fallback
                return dbData;
            }
            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] encrypted = Base64.getDecoder().decode(parts[1]);
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(getKey(), "AES"), parameterSpec);
            
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting data", e);
        }
    }
}
