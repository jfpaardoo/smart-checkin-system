package org.springframework.samples.smartcheckin.configuration.jwt;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JwtBlacklistService {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtBlacklistService.class);

    private final JwtBlacklistedTokenRepository repository;
    private final JwtUtils jwtUtils;

    @Autowired
    public JwtBlacklistService(JwtBlacklistedTokenRepository repository, JwtUtils jwtUtils) {
        this.repository = repository;
        this.jwtUtils = jwtUtils;
    }

    @Transactional
    public void blacklistToken(String token) {
        if (!repository.existsByToken(token)) {
            try {
                Date expiration = jwtUtils.getExpirationDateFromJwtToken(token);
                if (expiration != null) {
                    LocalDateTime expiresAt = expiration.toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();
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
        return repository.existsByToken(token);
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void cleanupExpiredTokens() {
        logger.info("Cleaning up expired blacklisted tokens...");
        repository.deleteByExpiresAtBefore(LocalDateTime.now(ZoneId.systemDefault()));
        logger.info("Finished cleaning up expired tokens");
    }
}
