package org.springframework.samples.smartcheckin.auth;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.fasterxml.jackson.annotation.JsonProperty;

@Service
public class CaptchaService {

    private static final Logger logger = LoggerFactory.getLogger(CaptchaService.class);
    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private static final String TEST_TOKEN = "1x00000000000000000000AA";
    private static final String MOCKED_TOKEN = "mocked-test-captcha-token";
    private static final String DEFAULT_TEST_SECRET = "1x0000000000000000000000000000000AA";

    @Value("${app.captcha.secret:1x0000000000000000000000000000000AA}")
    private String captchaSecret;

    @Value("${app.captcha.bypass-enabled:false}")
    private boolean bypassEnabled;

    private final Environment environment;
    private final RestTemplate restTemplate;

    public CaptchaService(RestTemplate restTemplate, @Autowired(required = false) Environment environment) {
        this.restTemplate = restTemplate;
        this.environment = environment;
    }

    @PostConstruct
    public void validateConfiguration() {
        if (environment != null && environment.acceptsProfiles(Profiles.of("prod", "production"))) {
            if (bypassEnabled) {
                throw new IllegalStateException("CRÍTICO: app.captcha.bypass-enabled no puede estar activo en el perfil de producción.");
            }
            if (captchaSecret == null || captchaSecret.isBlank() || DEFAULT_TEST_SECRET.equals(captchaSecret)) {
                throw new IllegalStateException("CRÍTICO: app.captcha.secret no está configurado o utiliza el secreto de prueba en producción.");
            }
        }
    }

    public boolean validateCaptcha(String captchaResponse) {
        if (captchaResponse == null || captchaResponse.isBlank()) {
            return false;
        }

        // Permitir tokens de prueba únicamente si el bypass está explícitamente activado (ej. suite de tests)
        if (bypassEnabled) {
            if (TEST_TOKEN.equals(captchaResponse) || MOCKED_TOKEN.equals(captchaResponse)) {
                return true;
            }
            if (DEFAULT_TEST_SECRET.equals(captchaSecret)) {
                return true;
            }
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("secret", captchaSecret);
        body.add("response", captchaResponse);

        try {
            CaptchaResponse response = restTemplate.postForObject(VERIFY_URL, body, CaptchaResponse.class);
            return response != null && response.isSuccess();
        } catch (RestClientException e) {
            logger.error("Error al validar el captcha con Cloudflare Turnstile: {}", e.getMessage());
            return false;
        }
    }

    public static class CaptchaResponse {
        @JsonProperty("success")
        private boolean success;

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }
    }
}