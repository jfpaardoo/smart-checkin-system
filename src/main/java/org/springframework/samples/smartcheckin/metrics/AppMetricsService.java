package org.springframework.samples.smartcheckin.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class AppMetricsService {

    private final Counter checkinSuccessCounter;
    private final Counter checkinAnomalyCounter;
    private final Counter auditVerificationSuccessCounter;
    private final Counter auditVerificationTamperedCounter;
    private final Counter passkeyRegistrationCounter;
    private final Counter passkeyAuthenticationCounter;
    private final Timer cryptoSignatureTimer;

    public AppMetricsService(MeterRegistry registry) {
        this.checkinSuccessCounter = Counter.builder("smartcheckin_checkins_total")
                .description("Total number of successful check-ins recorded")
                .tag("status", "success")
                .register(registry);

        this.checkinAnomalyCounter = Counter.builder("smartcheckin_anomalies_detected_total")
                .description("Total number of attendance/timing anomalies detected")
                .register(registry);

        this.auditVerificationSuccessCounter = Counter.builder("smartcheckin_audit_verifications_total")
                .description("Total number of SHA-256 hash chain audit log integrity verifications")
                .tag("result", "valid")
                .register(registry);

        this.auditVerificationTamperedCounter = Counter.builder("smartcheckin_audit_verifications_total")
                .description("Total number of SHA-256 hash chain audit log integrity verifications")
                .tag("result", "tampered")
                .register(registry);

        this.passkeyRegistrationCounter = Counter.builder("smartcheckin_passkey_operations_total")
                .description("Total number of FIDO2 Passkey operations")
                .tag("action", "register")
                .register(registry);

        this.passkeyAuthenticationCounter = Counter.builder("smartcheckin_passkey_operations_total")
                .description("Total number of FIDO2 Passkey operations")
                .tag("action", "authenticate")
                .register(registry);

        this.cryptoSignatureTimer = Timer.builder("smartcheckin_crypto_signature_duration_seconds")
                .description("Duration of cryptographic digital signature sealing")
                .register(registry);
    }

    public void incrementCheckinSuccess() {
        checkinSuccessCounter.increment();
    }

    public void incrementCheckinAnomaly() {
        checkinAnomalyCounter.increment();
    }

    public void incrementAuditVerification(boolean isValid) {
        if (isValid) {
            auditVerificationSuccessCounter.increment();
        } else {
            auditVerificationTamperedCounter.increment();
        }
    }

    public void incrementPasskeyRegistration() {
        passkeyRegistrationCounter.increment();
    }

    public void incrementPasskeyAuthentication() {
        passkeyAuthenticationCounter.increment();
    }

    public void recordCryptoSignatureDuration(long durationMs) {
        cryptoSignatureTimer.record(durationMs, TimeUnit.MILLISECONDS);
    }
}
