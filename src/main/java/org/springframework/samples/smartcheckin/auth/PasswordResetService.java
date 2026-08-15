package org.springframework.samples.smartcheckin.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.samples.smartcheckin.user.User;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;

import org.jpatterns.gof.SingletonPattern;

@Service
@SuppressWarnings("null")
@SingletonPattern.Singleton
public class PasswordResetService {

    private static final int EXPIRATION_MINUTES = 15;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    
    private final PasswordResetTokenRepository tokenRepository;

    @Autowired
    public PasswordResetService(PasswordResetTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Transactional
    public String createOrUpdatePasswordResetToken(User user) {
        tokenRepository.deleteByUser_Id(user.getId());

        byte[] randomBytes = new byte[48];
        SECURE_RANDOM.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiryDate(LocalDateTime.now(ZoneId.systemDefault()).plusMinutes(EXPIRATION_MINUTES));
        tokenRepository.save(resetToken);

        return token;
    }

    @Transactional(readOnly = true)
    public PasswordResetToken validatePasswordResetToken(String token) {
        return tokenRepository.findByToken(token)
                .filter(t -> t.getExpiryDate().isAfter(LocalDateTime.now(ZoneId.systemDefault())))
                .orElse(null);
    }

    @Transactional
    public void deleteToken(PasswordResetToken token) {
        tokenRepository.delete(token);
    }
}