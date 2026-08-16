package org.springframework.samples.smartcheckin.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class CaptchaServiceTests {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private CaptchaService captchaService;

    @Test
    void testValidateCaptcha_nullOrBlank() {
        assertFalse(captchaService.validateCaptcha(null));
        assertFalse(captchaService.validateCaptcha(""));
        assertFalse(captchaService.validateCaptcha("   "));
    }

    @Test
    void testValidateCaptcha_testTokens() {
        assertTrue(captchaService.validateCaptcha("1x00000000000000000000AA"));
        assertTrue(captchaService.validateCaptcha("mocked-test-captcha-token"));
    }

    @Test
    void testValidateCaptcha_defaultTestSecret() {
        ReflectionTestUtils.setField(captchaService, "captchaSecret", "1x0000000000000000000000000000000AA");
        assertTrue(captchaService.validateCaptcha("any-user-token"));
    }

    @Test
    void testValidateCaptcha_remoteSuccess() {
        ReflectionTestUtils.setField(captchaService, "captchaSecret", "custom-production-secret");
        CaptchaService.CaptchaResponse response = new CaptchaService.CaptchaResponse();
        response.setSuccess(true);

        when(restTemplate.postForObject(anyString(), any(), eq(CaptchaService.CaptchaResponse.class)))
                .thenReturn(response);

        assertTrue(captchaService.validateCaptcha("valid-remote-token"));
        assertTrue(response.isSuccess());
    }

    @Test
    void testValidateCaptcha_remoteFailure() {
        ReflectionTestUtils.setField(captchaService, "captchaSecret", "custom-production-secret");
        CaptchaService.CaptchaResponse response = new CaptchaService.CaptchaResponse();
        response.setSuccess(false);

        when(restTemplate.postForObject(anyString(), any(), eq(CaptchaService.CaptchaResponse.class)))
                .thenReturn(response);

        assertFalse(captchaService.validateCaptcha("invalid-remote-token"));
    }

    @Test
    void testValidateCaptcha_remoteNullResponse() {
        ReflectionTestUtils.setField(captchaService, "captchaSecret", "custom-production-secret");

        when(restTemplate.postForObject(anyString(), any(), eq(CaptchaService.CaptchaResponse.class)))
                .thenReturn(null);

        assertFalse(captchaService.validateCaptcha("token"));
    }

    @Test
    void testValidateCaptcha_restClientException() {
        ReflectionTestUtils.setField(captchaService, "captchaSecret", "custom-production-secret");

        when(restTemplate.postForObject(anyString(), any(), eq(CaptchaService.CaptchaResponse.class)))
                .thenThrow(new RestClientException("Connection error"));

        assertFalse(captchaService.validateCaptcha("token"));
    }
}
