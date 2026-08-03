package org.springframework.samples.smartcheckin.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EncryptionConfig {

    private static String secret;

    @Value("${app.encryption.secret:SuperSecretKey12345678901234567890}")
    @SuppressWarnings("java:S2696")
    public void setSecret(String secretValue) {
        EncryptionConfig.secret = secretValue;
    }

    public static String getSecret() {
        return secret;
    }
}
