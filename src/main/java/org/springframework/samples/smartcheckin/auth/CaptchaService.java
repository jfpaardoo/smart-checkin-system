package org.springframework.samples.smartcheckin.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    private final RestTemplate restTemplate;

    public CaptchaService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean validateCaptcha(String captchaResponse) {
        if (captchaResponse == null || captchaResponse.isBlank()) {
            return false;
        }

        // Si se usa el token de pruebas estándar de Cloudflare o mock de pruebas E2E
        if (TEST_TOKEN.equals(captchaResponse) || MOCKED_TOKEN.equals(captchaResponse)) {
            return true;
        }

        // Si el secret configurado es el de pruebas por defecto, aceptar para desarrollo local
        if (DEFAULT_TEST_SECRET.equals(captchaSecret)) {
            return true;
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