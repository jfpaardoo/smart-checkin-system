package org.springframework.samples.smartcheckin.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Autowired;

/**
 * Service for checking compromised passwords against the HaveIBeenPwned (HIBP) Pwned Passwords API.
 * Uses k-Anonymity (only the first 5 characters of the SHA-1 hash are sent to the API).
 */
@Service
@SuppressWarnings({ "null", "java:S2638", "java:S4790" })
public class HaveIBeenPwnedService {

    private static final Logger logger = LoggerFactory.getLogger(HaveIBeenPwnedService.class);
    private static final String HIBP_API_URL = "https://api.pwnedpasswords.com/range/";

    private final RestTemplate restTemplate;

    @Autowired
    public HaveIBeenPwnedService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofMillis(1500))
                .readTimeout(Duration.ofMillis(1500))
                .build();
    }

    // Package-private constructor for testing with mock RestTemplate
    HaveIBeenPwnedService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Checks if the given raw password has appeared in known data breaches.
     *
     * @param rawPassword The plaintext password to test.
     * @return true if the password is known to be compromised, false otherwise or on API failure (fail-open).
     */
    public boolean isPasswordPwned(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return false;
        }

        try {
            String sha1Hash = calculateSha1(rawPassword).toUpperCase();
            if (sha1Hash.length() != 40) {
                return false;
            }

            String prefix = sha1Hash.substring(0, 5);
            String suffix = sha1Hash.substring(5);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "SmartCheckin-Enterprise/1.0 (k-anonymity verification)");
            headers.set("Add-Padding", "true"); // Adds random padding hashes for extra privacy

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    HIBP_API_URL + prefix,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String body = response.getBody();
                return containsSuffix(body, suffix);
            }

        } catch (Exception e) {
            // Fail-open strategy: log warning without blocking user registration/reset if external API is unreachable
            logger.warn("HIBP check failed gracefully due to network/API error: {}", e.getMessage());
        }

        return false;
    }

    private boolean containsSuffix(String responseBody, String suffix) {
        String[] lines = responseBody.split("\\r?\\n");
        for (String line : lines) {
            int colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                String hashSuffix = line.substring(0, colonIndex).trim();
                if (hashSuffix.equalsIgnoreCase(suffix)) {
                    return true;
                }
            }
        }
        return false;
    }

    private String calculateSha1(String input) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
