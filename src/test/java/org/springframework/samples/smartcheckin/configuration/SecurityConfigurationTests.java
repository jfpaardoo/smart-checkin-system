package org.springframework.samples.smartcheckin.configuration;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfigurationSource;

class SecurityConfigurationTests {

    @Test
    void testSecurityConfigurationBeans() {
        SecurityConfiguration config = new SecurityConfiguration();
        ReflectionTestUtils.setField(config, "allowedOrigins", new String[] { "http://localhost:3000" });

        PasswordEncoder encoder = config.passwordEncoder();
        assertNotNull(encoder);
        assertTrue(encoder.matches("password123", encoder.encode("password123")));

        RoleHierarchy hierarchy = config.roleHierarchy();
        assertNotNull(hierarchy);
        assertFalse(hierarchy.getReachableGrantedAuthorities(
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ADMIN"))).isEmpty());

        CorsConfigurationSource corsSource = config.corsConfigurationSource();
        assertNotNull(corsSource);
    }
}
