package org.springframework.samples.smartcheckin.auth.webauthn;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class WebAuthnChallengeServiceTests {

    private WebAuthnChallengeService challengeService;

    @BeforeEach
    void setUp() {
        challengeService = new WebAuthnChallengeService();
    }

    @Test
    void testGenerateAndValidateChallengeWithoutUserSuccess() {
        String challenge = challengeService.generateChallenge(null);

        assertNotNull(challenge);
        assertFalse(challenge.isBlank());

        // Consumir el challenge
        boolean valid = challengeService.validateAndConsumeChallenge(challenge, null);
        assertTrue(valid);

        // Al intentar consumirlo de nuevo debe fallar (one-time use)
        assertFalse(challengeService.validateAndConsumeChallenge(challenge, null));
    }

    @Test
    void testGenerateAndValidateChallengeWithUserIdSuccess() {
        String challenge = challengeService.generateChallenge(42);

        assertNotNull(challenge);

        // Coincide el userId
        boolean valid = challengeService.validateAndConsumeChallenge(challenge, 42);
        assertTrue(valid);
    }

    @Test
    void testValidateChallengeWithMismatchedUserIdFails() {
        String challenge = challengeService.generateChallenge(42);

        // UserId no coincide
        boolean valid = challengeService.validateAndConsumeChallenge(challenge, 99);
        assertFalse(valid);
    }

    @Test
    void testValidateChallengeWithNullOrBlank() {
        assertFalse(challengeService.validateAndConsumeChallenge(null, null));
        assertFalse(challengeService.validateAndConsumeChallenge("", null));
        assertFalse(challengeService.validateAndConsumeChallenge("   ", null));
        assertFalse(challengeService.validateAndConsumeChallenge("non-existent-challenge", null));
    }

    @Test
    void testValidateExpiredChallengeFails() {
        String challenge = "expired-challenge-123";
        challengeService.putChallengeForTesting(challenge, Instant.now().minusSeconds(10), 1);

        // Debe ser inválido al expirar
        assertFalse(challengeService.validateAndConsumeChallenge(challenge, 1));
    }
}
