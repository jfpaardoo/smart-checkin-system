package org.springframework.samples.smartcheckin.configuration.jwt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Date;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

@SuppressWarnings("null")
class JwtBlacklistServiceTests {

    private JwtBlacklistedTokenRepository repository;
    private JwtUtils jwtUtils;
    private JwtBlacklistService jwtBlacklistService;

    @BeforeEach
    void setUp() {
        repository = mock(JwtBlacklistedTokenRepository.class);
        jwtUtils = mock(JwtUtils.class);
        jwtBlacklistService = new JwtBlacklistService(repository, jwtUtils);
    }

    @Test
    void testBlacklistToken_WhenNotBlacklistedAndValidExpiration_ShouldSaveToken() {
        String token = "valid_token";
        when(repository.existsByToken(token)).thenReturn(false);
        Date expirationDate = new Date(System.currentTimeMillis() + 3600000); // +1 hour
        when(jwtUtils.getExpirationDateFromJwtToken(token)).thenReturn(expirationDate);

        jwtBlacklistService.blacklistToken(token);

        ArgumentCaptor<JwtBlacklistedToken> tokenCaptor = ArgumentCaptor.forClass(JwtBlacklistedToken.class);
        verify(repository, times(1)).save(tokenCaptor.capture());

        JwtBlacklistedToken savedToken = tokenCaptor.getValue();
        assertEquals(token, savedToken.getToken());
        assertNotNull(savedToken.getExpiresAt());
    }

    @Test
    void testBlacklistToken_WhenAlreadyBlacklisted_ShouldNotSaveToken() {
        String token = "existing_token";
        when(repository.existsByToken(token)).thenReturn(true);

        jwtBlacklistService.blacklistToken(token);

        verify(repository, never()).save(any(JwtBlacklistedToken.class));
    }

    @Test
    void testBlacklistToken_WhenExpirationIsNull_ShouldNotSaveToken() {
        String token = "invalid_token";
        when(repository.existsByToken(token)).thenReturn(false);
        when(jwtUtils.getExpirationDateFromJwtToken(token)).thenReturn(null);

        jwtBlacklistService.blacklistToken(token);

        verify(repository, never()).save(any(JwtBlacklistedToken.class));
    }
    
    @Test
    void testBlacklistToken_WhenJwtUtilsThrowsException_ShouldHandleGracefully() {
        String token = "exception_token";
        when(repository.existsByToken(token)).thenReturn(false);
        when(jwtUtils.getExpirationDateFromJwtToken(token)).thenThrow(new RuntimeException("Parse error"));

        assertDoesNotThrow(() -> jwtBlacklistService.blacklistToken(token));

        verify(repository, never()).save(any(JwtBlacklistedToken.class));
    }

    @Test
    void testIsBlacklisted_ShouldReturnTrueIfTokenExists() {
        String token = "blacklisted_token";
        when(repository.existsByToken(token)).thenReturn(true);

        assertTrue(jwtBlacklistService.isBlacklisted(token));
    }

    @Test
    void testIsBlacklisted_ShouldReturnFalseIfTokenDoesNotExist() {
        String token = "clean_token";
        when(repository.existsByToken(token)).thenReturn(false);

        assertFalse(jwtBlacklistService.isBlacklisted(token));
    }

    @Test
    void testCleanupExpiredTokens_ShouldCallRepositoryDelete() {
        jwtBlacklistService.cleanupExpiredTokens();

        verify(repository, times(1)).deleteByExpiresAtBefore(any(LocalDateTime.class));
    }
}
