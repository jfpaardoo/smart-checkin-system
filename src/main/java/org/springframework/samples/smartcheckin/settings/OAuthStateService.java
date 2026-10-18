package org.springframework.samples.smartcheckin.settings;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gestión criptográfica de estados OAuth para OneDrive (SEC-04).
 * Previene ataques de CSRF en OAuth, replay attacks y open redirects.
 */
@Service
public class OAuthStateService {

    private static final Logger log = LoggerFactory.getLogger(OAuthStateService.class);
    private static final long STATE_TTL_SECONDS = 600; // 10 minutos
    private static final int MAX_PENDING_STATES = 1000;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, OAuthStateItem> stateStore = new ConcurrentHashMap<>();

    @Value("${app.frontend.url:http://localhost:3000}")
    private String configuredFrontendUrl;

    @Value("${app.cors.allowed-origins:http://localhost:3000,https://smart-checkin-system.onrender.com}")
    private String allowedOrigins;

    @Value("${app.oauth.frontend-settings-path:/admin/cloud-settings}")
    private String frontendSettingsPath;

    public record OAuthStateItem(
            String state,
            String adminUsername,
            Instant expiresAt,
            String targetFrontendUrl
    ) {}

    public String generateState(String adminUsername, String requestedHostOrOrigin) {
        cleanExpiredStates();

        if (stateStore.size() >= MAX_PENDING_STATES) {
            stateStore.clear();
        }

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String stateToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String safeReturnUrl = resolveSafeReturnUrl(requestedHostOrOrigin);

        OAuthStateItem item = new OAuthStateItem(
                stateToken,
                adminUsername,
                Instant.now().plusSeconds(STATE_TTL_SECONDS),
                safeReturnUrl
        );

        stateStore.put(stateToken, item);
        log.info("Generado OAuth state para administrador '{}' con TTL de {}s", adminUsername, STATE_TTL_SECONDS);
        return stateToken;
    }

    public Optional<OAuthStateItem> validateAndConsumeState(String stateToken) {
        if (stateToken == null || stateToken.isBlank()) {
            return Optional.empty();
        }

        OAuthStateItem item = stateStore.remove(stateToken.trim());
        if (item == null) {
            log.warn("Rechazado callback OAuth: state token no encontrado o ya consumido.");
            return Optional.empty();
        }

        if (Instant.now().isAfter(item.expiresAt())) {
            log.warn("Rechazado callback OAuth: state token expirado.");
            return Optional.empty();
        }

        return Optional.of(item);
    }

    public String getCanonicalFrontendSettingsUrl() {
        return trimTrailingSlash(configuredFrontendUrl) + frontendSettingsPath;
    }

    private String resolveSafeReturnUrl(String candidate) {
        String canonical = getCanonicalFrontendSettingsUrl();
        if (candidate == null || candidate.isBlank()) {
            return canonical;
        }

        try {
            URI candidateUri = URI.create(candidate.trim());
            String candidateOrigin = candidateUri.getScheme() + "://" + candidateUri.getAuthority();

            if (isOriginInAllowlist(candidateOrigin)) {
                return trimTrailingSlash(candidateOrigin) + frontendSettingsPath;
            }
        } catch (Exception e) {
            log.debug("No se pudo interpretar el origen solicitado '{}': {}", candidate, e.getMessage());
        }

        return canonical;
    }

    private boolean isOriginInAllowlist(String origin) {
        if (origin == null || origin.isBlank()) {
            return false;
        }
        String normalized = origin.trim().toLowerCase();

        if (configuredFrontendUrl != null && normalized.equalsIgnoreCase(trimTrailingSlash(configuredFrontendUrl.trim()))) {
            return true;
        }

        if (allowedOrigins != null) {
            for (String allowed : allowedOrigins.split(",")) {
                if (normalized.equalsIgnoreCase(trimTrailingSlash(allowed.trim()))) {
                    return true;
                }
            }
        }
        return false;
    }

    private String trimTrailingSlash(String str) {
        if (str == null) return "";
        return str.endsWith("/") ? str.substring(0, str.length() - 1) : str;
    }

    private void cleanExpiredStates() {
        Instant now = Instant.now();
        stateStore.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }
}
