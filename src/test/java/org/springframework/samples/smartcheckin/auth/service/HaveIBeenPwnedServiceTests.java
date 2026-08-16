package org.springframework.samples.smartcheckin.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@SuppressWarnings("null")
class HaveIBeenPwnedServiceTests {

    @Mock
    private RestTemplate restTemplate;

    private HaveIBeenPwnedService haveIBeenPwnedService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        haveIBeenPwnedService = new HaveIBeenPwnedService(restTemplate);
    }

    @Test
    void testNullOrBlankPasswordReturnsFalse() {
        assertFalse(haveIBeenPwnedService.isPasswordPwned(null));
        assertFalse(haveIBeenPwnedService.isPasswordPwned(""));
        assertFalse(haveIBeenPwnedService.isPasswordPwned("   "));
    }

    @Test
    void testPasswordFoundInBreachReturnsTrue() {
        // "password" SHA-1 is 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
        // Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
        String mockApiResponse = """
                0018A45C4D1DEF81644B54AB7F969B88D65:1
                1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493
                FE5C6E53368297AA5FB71DEFEFF77FF4288:2
                """;

        when(restTemplate.exchange(contains("5BAA6"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(mockApiResponse, HttpStatus.OK));

        boolean isPwned = haveIBeenPwnedService.isPasswordPwned("password");
        assertTrue(isPwned);
    }

    @Test
    void testPasswordNotFoundInBreachReturnsFalse() {
        String mockApiResponse = """
                0018A45C4D1DEF81644B54AB7F969B88D65:1
                AABBCC11223344556677889900FFEEDDCCB:5
                """;

        when(restTemplate.exchange(any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(mockApiResponse, HttpStatus.OK));

        boolean isPwned = haveIBeenPwnedService.isPasswordPwned("UltraSecureSuperPassword#2026!XYZ");
        assertFalse(isPwned);
    }

    @Test
    void testApiThrowsExceptionFailsOpenReturnsFalse() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("Connection timed out"));

        boolean isPwned = haveIBeenPwnedService.isPasswordPwned("password123");
        assertFalse(isPwned);
    }
}
