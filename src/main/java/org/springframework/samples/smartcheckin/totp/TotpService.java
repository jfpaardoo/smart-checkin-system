package org.springframework.samples.smartcheckin.totp;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.jpatterns.gof.SingletonPattern;

@Service
@SingletonPattern.Singleton
public class TotpService {

    @Value("${smartcheckin.app.totpSecret:DEFAULT_SECRET}")
    private String secret;

    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier verifier;

    public TotpService() {
        DefaultCodeVerifier v = new DefaultCodeVerifier(codeGenerator, timeProvider);
        v.setTimePeriod(30); // Estándar de 30s compatible con Google Authenticator / Authy
        v.setAllowedTimePeriodDiscrepancy(1); // Permite un margen de desfase de 1 intervalo (±30s)
        this.verifier = v;
    }

    public String getCurrentToken() {
        return getCurrentToken((Object) null);
    }

    public String getCurrentToken(Object formationId) {
        try {
            long currentBucket = Math.floorDiv(timeProvider.getTime(), 30);
            String targetSecret = getHashedSecretForFormation(formationId);
            return codeGenerator.generate(targetSecret, currentBucket);
        } catch (Exception e) {
            throw new RuntimeException("Error generating TOTP token", e);
        }
    }

    public boolean verifyToken(String token) {
        return verifyToken(token, (Object) null);
    }

    public boolean verifyToken(String token, Object formationId) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        String targetSecret = getHashedSecretForFormation(formationId);
        return verifier.isValidCode(targetSecret, token);
    }

    private String getHashedSecretForFormation(Object formationId) {
        String formIdStr = (formationId != null) ? String.valueOf(formationId).trim() : null;
        String rawSecret = (formIdStr == null || formIdStr.isEmpty() || "null".equalsIgnoreCase(formIdStr))
                ? secret
                : secret + "_FORMATION_" + formIdStr;

        Base32 base32 = new Base32();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawSecret.getBytes(StandardCharsets.UTF_8));
            return base32.encodeAsString(hash).replace("=", "");
        } catch (Exception e) {
            return base32.encodeAsString(rawSecret.getBytes(StandardCharsets.UTF_8)).replace("=", "");
        }
    }

    public boolean validateCode(String twoFactorSecret, String code) {
        if (twoFactorSecret == null || twoFactorSecret.trim().isEmpty() || code == null || code.trim().isEmpty()) {
            return false;
        }
        return verifier.isValidCode(twoFactorSecret, code);
    }

    public String generateCode(String twoFactorSecret) {
        if (twoFactorSecret == null || twoFactorSecret.trim().isEmpty()) {
            return null;
        }
        try {
            long currentBucket = Math.floorDiv(timeProvider.getTime(), 30);
            return codeGenerator.generate(twoFactorSecret, currentBucket);
        } catch (Exception e) {
            throw new RuntimeException("Error generating TOTP token for secret", e);
        }
    }
}