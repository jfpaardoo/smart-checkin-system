package org.springframework.samples.smartcheckin.auth;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;

class JwtResponseTests {

    private static final String TOKEN_123 = "token123";
    private static final String USER_1 = "user1";
    private static final String ADMIN_ROLE = "ADMIN";

    @Test
    void testDefaultConstructorAndSetters() {
        JwtResponse response = new JwtResponse();
        response.setToken(TOKEN_123);
        response.setType("BearerToken");
        response.setId(1);
        response.setUsername(USER_1);
        response.setRoles(List.of(ADMIN_ROLE));
        response.setRequiresTwoFactor(true);

        assertEquals(TOKEN_123, response.getToken());
        assertEquals("BearerToken", response.getType());
        assertEquals(1, response.getId());
        assertEquals(USER_1, response.getUsername());
        assertTrue(response.getRoles().contains(ADMIN_ROLE));
        assertTrue(response.getRequiresTwoFactor());
    }

    @Test
    void testIntegerConstructor() {
        JwtResponse response = new JwtResponse(TOKEN_123, 1, USER_1, List.of(ADMIN_ROLE));
        
        assertEquals(TOKEN_123, response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals(1, response.getId());
        assertEquals(USER_1, response.getUsername());
        assertTrue(response.getRoles().contains(ADMIN_ROLE));
        assertFalse(response.getRequiresTwoFactor()); // Valor por defecto
    }

    @Test
    void testLongConstructorWithNonNullId() {
        JwtResponse response = new JwtResponse(TOKEN_123, 100L, USER_1, List.of("USER"));
        
        assertEquals(TOKEN_123, response.getToken());
        assertEquals(100, response.getId());
        assertEquals(USER_1, response.getUsername());
    }

    // --- TEST PARA LA RAMA CONDICIONAL FALTANTE ---

    @Test
    void testLongConstructorWithNullId() {
        JwtResponse response = new JwtResponse(TOKEN_123, (Long) null, USER_1, List.of("USER"));
        
        assertEquals(TOKEN_123, response.getToken());
        assertNull(response.getId());
        assertEquals(USER_1, response.getUsername());
    }

    @Test
    void testToString() {
        JwtResponse response = new JwtResponse(TOKEN_123, 1, USER_1, List.of(ADMIN_ROLE));
        response.setRequiresTwoFactor(true);
        
        String str = response.toString();
        
        assertTrue(str.contains("token=" + TOKEN_123));
        assertTrue(str.contains("type=Bearer"));
        assertTrue(str.contains("id=1"));
        assertTrue(str.contains("username=" + USER_1));
        assertTrue(str.contains("roles=[" + ADMIN_ROLE + "]"));
        assertTrue(str.contains("requiresTwoFactor=true"));
    }
}