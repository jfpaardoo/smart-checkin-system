package org.springframework.samples.smartcheckin.configuration.jwt;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

@Service
public class JwtBlacklistService {

    private static final Logger logger = LoggerFactory.getLogger(JwtBlacklistService.class);

    private final JwtBlacklistedTokenRepository repository;
    private final JwtUtils jwtUtils;

    private final Cache<String, Boolean> blacklistCache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(20_000)
            .build();

    @Autowired
    public JwtBlacklistService(JwtBlacklistedTokenRepository repository, JwtUtils jwtUtils) {
        this.repository = repository;
        this.jwtUtils = jwtUtils;
    }

    @Transactional
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        blacklistCache.put(token, Boolean.TRUE);
        if (!repository.existsByToken(token)) {
            try {
                Instant expiration = jwtUtils.getExpirationDateFromJwtToken(token);
                if (expiration != null) {
                    LocalDateTime expiresAt = LocalDateTime.ofInstant(
                            expiration,
                            ZoneId.systemDefault());
                    repository.save(new JwtBlacklistedToken(token, expiresAt));
                    logger.info("JWT Token added to blacklist");
                }
            } catch (Exception e) {
                logger.error("Failed to parse token for blacklisting: {}", e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Boolean cached = blacklistCache.getIfPresent(token);
        if (cached != null) {
            return cached;
        }
        boolean exists = repository.existsByToken(token);
        blacklistCache.put(token, exists);
        return exists;
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void cleanupExpiredTokens() {
        logger.info("Cleaning up expired blacklisted tokens...");
        repository.deleteByExpiresAtBefore(LocalDateTime.now(ZoneId.systemDefault()));
        blacklistCache.invalidateAll();
        logger.info("Finished cleaning up expired tokens");
    }
}
