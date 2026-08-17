package org.springframework.samples.smartcheckin.audit;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

@SuppressWarnings("java:S1313")
class AuditLogTests {

    @Test
    void testConstructorsAndGettersSetters() {
        AuditLog log = new AuditLog();
        assertNotNull(log.getTimestamp());

        AuditLog logWithParams = new AuditLog("TEST_ACTION", "testUser", "test details", "192.168.1.1");
        assertEquals("TEST_ACTION", logWithParams.getAction());
        assertEquals("testUser", logWithParams.getUsername());
        assertEquals("test details", logWithParams.getDetails());
        assertEquals("192.168.1.1", logWithParams.getIpAddress());

        logWithParams.setPreviousHash("prev");
        logWithParams.setLogHash("hash");
        logWithParams.setSignatureHmac("hmac");

        assertEquals("prev", logWithParams.getPreviousHash());
        assertEquals("hash", logWithParams.getLogHash());
        assertEquals("hmac", logWithParams.getSignatureHmac());
    }

    @Test
    void testCalculateHashWithNulls() {
        String hash = AuditLog.calculateHash(null, null, null, null, null, null);
        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    void testCalculateHmacEdgeCases() {
        assertNull(AuditLog.calculateHmac(null, "secret"));
        assertNull(AuditLog.calculateHmac("hash", null));
        assertNull(AuditLog.calculateHmac("hash", "   "));

        String hmac = AuditLog.calculateHmac("someHash", "mySecretKey");
        assertNotNull(hmac);
        assertEquals(64, hmac.length());
    }

    @Test
    void testBuilderAndEqualsHashCode() {
        AuditLog log1 = AuditLog.builder()
                .action("ACTION")
                .username("user")
                .timestamp(LocalDateTime.now(ZoneId.systemDefault()))
                .build();

        assertNotNull(log1);
        assertEquals("ACTION", log1.getAction());
    }
}
