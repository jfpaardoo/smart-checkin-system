package org.springframework.samples.smartcheckin.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EncryptionConfig {

    private static String secret;

    @Value("${app.encryption.secret}")
    @SuppressWarnings("java:S2696")
    public void setSecret(String secretValue) {
        if (secretValue == null || secretValue.length() < 16) {
            throw new IllegalArgumentException("CRÍTICO: app.encryption.secret no configurado o inferior a 16 caracteres.");
        }
        EncryptionConfig.secret = secretValue;
    }

    public static String getSecret() {
        return secret;
    }
}