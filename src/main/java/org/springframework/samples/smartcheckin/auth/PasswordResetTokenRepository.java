package org.springframework.samples.smartcheckin.auth;

import org.springframework.data.repository.CrudRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends CrudRepository<PasswordResetToken, Integer> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    void deleteByUser_Id(Integer userId);

    void deleteByExpiryDateBefore(LocalDateTime expiryDate);
}