package org.springframework.samples.smartcheckin.auth.webauthn;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebAuthnChallengeService {

    private static final long CHALLENGE_TTL_SECONDS = 120; // 2 minutos
    private static final int MAX_CACHE_ENTRIES = 10_000;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, ChallengeItem> challengeCache = new ConcurrentHashMap<>();

    record ChallengeItem(String challenge, Instant expiresAt, Integer userId) {}

    public String generateChallenge(Integer userId) {
        cleanExpiredChallenges();

        // Control estricto de capacidad contra agotamiento de memoria (SEC-12)
        if (challengeCache.size() >= MAX_CACHE_ENTRIES) {
            challengeCache.clear();
        }

        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String challenge = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        challengeCache.put(challenge, new ChallengeItem(
                challenge,
                Instant.now().plusSeconds(CHALLENGE_TTL_SECONDS),
                userId
        ));

        return challenge;
    }

    public boolean validateAndConsumeChallenge(String challenge, Integer expectedUserId) {
        if (challenge == null || challenge.isBlank()) {
            return false;
        }

        ChallengeItem item = challengeCache.remove(challenge);
        if (item == null) {
            return false;
        }

        if (Instant.now().isAfter(item.expiresAt())) {
            return false;
        }

        return expectedUserId == null || item.userId() == null || expectedUserId.equals(item.userId());
    }

    // Package-private helper para pruebas unitarias de expiración
    void putChallengeForTesting(String challenge, Instant expiresAt, Integer userId) {
        challengeCache.put(challenge, new ChallengeItem(challenge, expiresAt, userId));
    }

    private void cleanExpiredChallenges() {
        Instant now = Instant.now();
        challengeCache.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
    }
}
