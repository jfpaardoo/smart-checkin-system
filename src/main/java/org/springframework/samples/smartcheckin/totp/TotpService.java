package org.springframework.samples.smartcheckin.totp;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    @Value("${smartcheckin.app.totpSecret}")
    private String secret;

    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier verifier;

    public TotpService() {
        DefaultCodeVerifier v = new DefaultCodeVerifier(codeGenerator, timeProvider);
        v.setTimePeriod(10);
        v.setAllowedTimePeriodDiscrepancy(1);
        this.verifier = v;
    }

    public String getCurrentToken() {
        try {
            long currentBucket = Math.floorDiv(timeProvider.getTime(), 10);
            return codeGenerator.generate(secret, currentBucket);
        } catch (Exception e) {
            throw new RuntimeException("Error generating TOTP token", e);
        }
    }

    public boolean verifyToken(String token) {
        return verifier.isValidCode(secret, token);
    }
}
