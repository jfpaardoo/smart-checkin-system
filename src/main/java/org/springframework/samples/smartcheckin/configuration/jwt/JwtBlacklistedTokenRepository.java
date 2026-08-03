package org.springframework.samples.smartcheckin.configuration.jwt;

import java.time.LocalDateTime;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JwtBlacklistedTokenRepository extends CrudRepository<JwtBlacklistedToken, Integer> {

    boolean existsByToken(String token);

    void deleteByExpiresAtBefore(LocalDateTime now);
}
