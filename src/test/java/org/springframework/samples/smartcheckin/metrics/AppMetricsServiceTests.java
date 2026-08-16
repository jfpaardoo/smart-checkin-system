package org.springframework.samples.smartcheckin.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AppMetricsServiceTests {

    private MeterRegistry meterRegistry;
    private AppMetricsService metricsService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        metricsService = new AppMetricsService(meterRegistry);
    }

    @Test
    void testIncrementCheckinSuccess() {
        metricsService.incrementCheckinSuccess();
        assertEquals(1.0, meterRegistry.get("smartcheckin_checkins_total").tag("status", "success").counter().count());
    }

    @Test
    void testIncrementCheckinAnomaly() {
        metricsService.incrementCheckinAnomaly();
        assertEquals(1.0, meterRegistry.get("smartcheckin_anomalies_detected_total").counter().count());
    }

    @Test
    void testIncrementAuditVerification() {
        metricsService.incrementAuditVerification(true);
        metricsService.incrementAuditVerification(false);
        assertEquals(1.0, meterRegistry.get("smartcheckin_audit_verifications_total").tag("result", "valid").counter().count());
        assertEquals(1.0, meterRegistry.get("smartcheckin_audit_verifications_total").tag("result", "tampered").counter().count());
    }

    @Test
    void testIncrementPasskeyOperations() {
        metricsService.incrementPasskeyRegistration();
        metricsService.incrementPasskeyAuthentication();
        assertEquals(1.0, meterRegistry.get("smartcheckin_passkey_operations_total").tag("action", "register").counter().count());
        assertEquals(1.0, meterRegistry.get("smartcheckin_passkey_operations_total").tag("action", "authenticate").counter().count());
    }

    @Test
    void testRecordCryptoSignatureDuration() {
        metricsService.recordCryptoSignatureDuration(120);
        assertEquals(1L, meterRegistry.get("smartcheckin_crypto_signature_duration_seconds").timer().count());
    }
}
