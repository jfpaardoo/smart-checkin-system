package org.springframework.samples.smartcheckin.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.fasterxml.jackson.annotation.JsonProperty;

@Service
public class CaptchaService {

    @Value("${app.captcha.secret:1x0000000000000000000000000000000AA}")
    private String captchaSecret;

    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public boolean validateCaptcha(String captchaResponse) {
        if (captchaResponse == null || captchaResponse.isEmpty()) {
            return false;
        }

        RestTemplate restTemplate = new RestTemplate();
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("secret", captchaSecret);
        body.add("response", captchaResponse);

        CaptchaResponse response = restTemplate.postForObject(VERIFY_URL, body, CaptchaResponse.class);
        return response != null && response.isSuccess();
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