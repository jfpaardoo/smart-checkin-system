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

    @Value("${app.captcha.secret:1x0000000000000000000000000000000AA}")
    private String captchaSecret;

    private final RestTemplate restTemplate;

    // Inyectamos un único RestTemplate reutilizable en lugar de crear uno por petición
    public CaptchaService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean validateCaptcha(String captchaResponse) {
        if (captchaResponse == null || captchaResponse.isBlank()) {
            return false;
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("secret", captchaSecret);
        body.add("response", captchaResponse);

        try {
            CaptchaResponse response = restTemplate.postForObject(VERIFY_URL, body, CaptchaResponse.class);
            return response != null && response.isSuccess();
        } catch (RestClientException e) {
            // Fail-closed: si Cloudflare no responde o hay un error de red, denegamos la petición
            // en lugar de dejar pasar al usuario o reventar con un 500.
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