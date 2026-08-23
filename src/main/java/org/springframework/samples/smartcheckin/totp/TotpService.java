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

import java.util.concurrent.ConcurrentHashMap;
import org.jpatterns.gof.SingletonPattern;

@Service
@SingletonPattern.Singleton
public class TotpService {

    @Value("${smartcheckin.app.totpSecret:DEFAULT_SECRET}")
    private String secret;

    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier qrVerifier;
    private final CodeVerifier twoFactorVerifier;
    
    // Key: formationId (or "GLOBAL"), Value: [lat, lng]
    private final ConcurrentHashMap<String, double[]> adminLocationCache = new ConcurrentHashMap<>();

    public TotpService() {
        // QR Dinámico para formaciones y fichajes: Período de 20 segundos
        DefaultCodeVerifier qrV = new DefaultCodeVerifier(codeGenerator, timeProvider);
        qrV.setTimePeriod(20);
        qrV.setAllowedTimePeriodDiscrepancy(1); // Margen de ±20s para compensar latencia de red
        this.qrVerifier = qrV;

        // Autenticación en dos factores (2FA): Estándar RFC 6238 de 30s para Google Authenticator / Authy
        DefaultCodeVerifier twoFactV = new DefaultCodeVerifier(codeGenerator, timeProvider);
        twoFactV.setTimePeriod(30);
        twoFactV.setAllowedTimePeriodDiscrepancy(1);
        this.twoFactorVerifier = twoFactV;
    }

    public String getCurrentToken() {
        return getCurrentToken((Object) null);
    }

    public String getCurrentToken(Object formationId) {
        try {
            long currentBucket = Math.floorDiv(timeProvider.getTime(), 20);
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
        return qrVerifier.isValidCode(targetSecret, token);
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
        return twoFactorVerifier.isValidCode(twoFactorSecret, code);
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

    public void cacheAdminLocation(Object formationId, Double lat, Double lng) {
        if (lat == null || lng == null) return;
        String key = (formationId != null) ? String.valueOf(formationId).trim() : "GLOBAL";
        adminLocationCache.put(key, new double[]{lat, lng});
    }

    public double[] getCachedAdminLocation(Object formationId) {
        String key = (formationId != null) ? String.valueOf(formationId).trim() : "GLOBAL";
        return adminLocationCache.get(key);
    }
}