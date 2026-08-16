package org.springframework.samples.smartcheckin.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.user.User;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTests {

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
    }

    @Test
    void testCreateOrUpdatePasswordResetToken() {
        String token = passwordResetService.createOrUpdatePasswordResetToken(user);

        assertNotNull(token);
        assertFalse(token.isBlank());
        verify(tokenRepository).deleteByUser_Id(1);
        verify(tokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void testValidatePasswordResetToken_valid() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("validToken123");
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now(ZoneId.systemDefault()).plusMinutes(10));

        when(tokenRepository.findByToken("validToken123")).thenReturn(Optional.of(resetToken));

        PasswordResetToken result = passwordResetService.validatePasswordResetToken("validToken123");
        assertNotNull(result);
        assertEquals("validToken123", result.getToken());
    }

    @Test
    void testValidatePasswordResetToken_expired() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("expiredToken123");
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now(ZoneId.systemDefault()).minusMinutes(5));

        when(tokenRepository.findByToken("expiredToken123")).thenReturn(Optional.of(resetToken));

        PasswordResetToken result = passwordResetService.validatePasswordResetToken("expiredToken123");
        assertNull(result);
    }

    @Test
    void testValidatePasswordResetToken_notFound() {
        when(tokenRepository.findByToken("unknownToken")).thenReturn(Optional.empty());

        PasswordResetToken result = passwordResetService.validatePasswordResetToken("unknownToken");
        assertNull(result);
    }

    @Test
    void testDeleteToken() {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken("toDelete");

        passwordResetService.deleteToken(resetToken);
        verify(tokenRepository).delete(resetToken);
    }
}
