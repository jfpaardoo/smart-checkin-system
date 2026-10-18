package org.springframework.samples.smartcheckin.settings;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SuppressWarnings("null")
class OAuthStateServiceTests {

    private OAuthStateService oAuthStateService;

    @BeforeEach
    void setUp() {
        oAuthStateService = new OAuthStateService();
        ReflectionTestUtils.setField(oAuthStateService, "configuredFrontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(oAuthStateService, "allowedOrigins", "http://localhost:3000,https://smart-checkin-system.onrender.com");
        ReflectionTestUtils.setField(oAuthStateService, "frontendSettingsPath", "/admin/cloud-settings");
    }

    @Test
    void testGenerateStateAndConsumeSuccessfully() {
        String state = oAuthStateService.generateState("adminUser", "http://localhost:3000");
        assertNotNull(state);
        assertFalse(state.isBlank());

        Optional<OAuthStateService.OAuthStateItem> itemOpt = oAuthStateService.validateAndConsumeState(state);
        assertTrue(itemOpt.isPresent());
        assertEquals("adminUser", itemOpt.get().adminUsername());
        assertEquals("http://localhost:3000/admin/cloud-settings", itemOpt.get().targetFrontendUrl());

        // Single-use: consuming again should fail
        Optional<OAuthStateService.OAuthStateItem> replayOpt = oAuthStateService.validateAndConsumeState(state);
        assertTrue(replayOpt.isEmpty());
    }

    @Test
    void testValidateInvalidOrUnknownState() {
        assertTrue(oAuthStateService.validateAndConsumeState(null).isEmpty());
        assertTrue(oAuthStateService.validateAndConsumeState("").isEmpty());
        assertTrue(oAuthStateService.validateAndConsumeState("non-existent-state").isEmpty());
    }

    @Test
    void testOpenRedirectPreventionUsesCanonicalFallback() {
        // Untrusted attacker origin
        String state = oAuthStateService.generateState("adminUser", "https://evil-attacker.com");
        Optional<OAuthStateService.OAuthStateItem> itemOpt = oAuthStateService.validateAndConsumeState(state);
        
        assertTrue(itemOpt.isPresent());
        // Must fallback to configured frontend URL, NOT redirect to evil-attacker.com
        assertEquals("http://localhost:3000/admin/cloud-settings", itemOpt.get().targetFrontendUrl());
    }

    @Test
    void testAllowedOriginIsAccepted() {
        String state = oAuthStateService.generateState("adminUser", "https://smart-checkin-system.onrender.com");
        Optional<OAuthStateService.OAuthStateItem> itemOpt = oAuthStateService.validateAndConsumeState(state);
        
        assertTrue(itemOpt.isPresent());
        assertEquals("https://smart-checkin-system.onrender.com/admin/cloud-settings", itemOpt.get().targetFrontendUrl());
    }
}
