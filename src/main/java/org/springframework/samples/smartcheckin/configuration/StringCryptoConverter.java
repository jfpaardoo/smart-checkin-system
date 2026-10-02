package org.springframework.samples.smartcheckin.configuration;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
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
    public static final String ACTIVE_VERSION = "v1";

    /**
     * Deriva una clave AES-256 de 32 bytes (256 bits) usando SHA-256 a partir del secreto configurado.
     */
    private byte[] getActiveV1Key() {
        String secret = EncryptionConfig.getSecret();
        if (secret == null || secret.length() < 16) {
            throw new IllegalStateException("CRÍTICO: Clave de cifrado ausente o inválida en StringCryptoConverter.");
        }
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return sha256.digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException("Error derivando clave AES-256", e);
        }
    }

    /**
     * Clave legacy v0: 16 bytes truncados (compatibilidad hacia atrás con registros previos a v1.3).
     */
    private byte[] getLegacyV0Key() {
        String secret = EncryptionConfig.getSecret();
        if (secret == null || secret.length() < 16) {
            throw new IllegalStateException("CRÍTICO: Clave de cifrado ausente o inválida en StringCryptoConverter.");
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
            
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(getActiveV1Key(), "AES"), parameterSpec);
            byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            String ivString = Base64.getEncoder().encodeToString(iv);
            String encryptedString = Base64.getEncoder().encodeToString(encrypted);
            
            return ACTIVE_VERSION + ":" + ivString + ":" + encryptedString;
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting data", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        String[] parts = dbData.split(":");
        if (parts.length == 3 && ACTIVE_VERSION.equalsIgnoreCase(parts[0])) {
            try {
                // Formato v1 versionado con AES-256
                byte[] iv = Base64.getDecoder().decode(parts[1]);
                byte[] encrypted = Base64.getDecoder().decode(parts[2]);
                return decrypt(encrypted, iv, getActiveV1Key());
            } catch (Exception e) {
                throw new SecurityException("Fallo criptográfico al descifrar atributo versionado: datos corruptos o manipulados", e);
            }
        } else if (parts.length == 2) {
            try {
                // Formato legacy v0 (iv:encrypted) con clave de 16 bytes
                byte[] iv = Base64.getDecoder().decode(parts[0]);
                byte[] encrypted = Base64.getDecoder().decode(parts[1]);
                return decryptLegacyWithFallback(encrypted, iv);
            } catch (Exception e) {
                return dbData;
            }
        } else {
            // Fallback para datos antiguos sin cifrar en texto plano
            return dbData;
        }
    }

    private String decryptLegacyWithFallback(byte[] encrypted, byte[] iv) {
        try {
            return decrypt(encrypted, iv, getLegacyV0Key());
        } catch (GeneralSecurityException ex) {
            return tryDecryptWithActiveKey(encrypted, iv);
        }
    }

    private String tryDecryptWithActiveKey(byte[] encrypted, byte[] iv) {
        try {
            return decrypt(encrypted, iv, getActiveV1Key());
        } catch (GeneralSecurityException fallbackEx) {
            throw new SecurityException("Fallo al descifrar payload legacy", fallbackEx);
        }
    }

    private String decrypt(byte[] encrypted, byte[] iv, byte[] key) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), parameterSpec);
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }
}