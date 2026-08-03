package org.springframework.samples.smartcheckin.configuration.jwt;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class JwtBlacklistScheduledIntegrationTests {

    @Autowired
    private JwtBlacklistService jwtBlacklistService;

    @Autowired
    private JwtBlacklistedTokenRepository repository;

    @Test
    void testScheduledCleanup_ShouldRemoveExpiredTokensFromDatabase() {
        // 1. Insert an expired token
        JwtBlacklistedToken expired = new JwtBlacklistedToken();
        expired.setToken("expired_jwt_token_123");
        expired.setExpiresAt(LocalDateTime.now().minusHours(2));
        repository.save(expired);

        // 2. Insert a valid token
        JwtBlacklistedToken valid = new JwtBlacklistedToken();
        valid.setToken("valid_jwt_token_456");
        valid.setExpiresAt(LocalDateTime.now().plusHours(5));
        repository.save(valid);

        // 3. Trigger cleanup
        jwtBlacklistService.cleanupExpiredTokens();

        // 4. Verify database state
        assertFalse(repository.existsByToken("expired_jwt_token_123"), "Expired token should be deleted");
        assertTrue(repository.existsByToken("valid_jwt_token_456"), "Valid token should remain in database");

        // Clean up
        repository.delete(valid);
    }
}
