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
import java.security.NoSuchAlgorithmException;

@Service
public class TotpService {

    @Value("${smartcheckin.app.totpSecret:DEFAULT_SECRET}")
    private String secret;

    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier verifier;

    public TotpService() {
        DefaultCodeVerifier v = new DefaultCodeVerifier(codeGenerator, timeProvider);
        v.setTimePeriod(20);
        v.setAllowedTimePeriodDiscrepancy(1);
        this.verifier = v;
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
            // Fundamental: Codificamos en Base32 estricto en lugar de Hexadecimal
            return base32.encodeAsString(hash).replace("=", "");
        } catch (NoSuchAlgorithmException e) {
            // Fallback seguro en Base32
            return base32.encodeAsString(rawSecret.getBytes(StandardCharsets.UTF_8)).replace("=", "");
        }
    }
}