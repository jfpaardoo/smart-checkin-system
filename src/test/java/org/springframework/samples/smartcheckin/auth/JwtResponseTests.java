package org.springframework.samples.smartcheckin.auth;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;

class JwtResponseTests {

    @Test
    void testDefaultConstructorAndSetters() {
        JwtResponse response = new JwtResponse();
        response.setToken("token123");
        response.setType("BearerToken");
        response.setId(1);
        response.setUsername("user1");
        response.setRoles(List.of("ADMIN"));
        response.setRequiresTwoFactor(true);

        assertEquals("token123", response.getToken());
        assertEquals("BearerToken", response.getType());
        assertEquals(1, response.getId());
        assertEquals("user1", response.getUsername());
        assertTrue(response.getRoles().contains("ADMIN"));
        assertTrue(response.getRequiresTwoFactor());
    }

    @Test
    void testIntegerConstructor() {
        JwtResponse response = new JwtResponse("token123", 1, "user1", List.of("ADMIN"));
        
        assertEquals("token123", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals(1, response.getId());
        assertEquals("user1", response.getUsername());
        assertTrue(response.getRoles().contains("ADMIN"));
        assertFalse(response.getRequiresTwoFactor()); // Valor por defecto
    }

    @Test
    void testLongConstructorWithNonNullId() {
        JwtResponse response = new JwtResponse("token123", 100L, "user1", List.of("USER"));
        
        assertEquals("token123", response.getToken());
        assertEquals(100, response.getId());
        assertEquals("user1", response.getUsername());
    }

    // --- TEST PARA LA RAMA CONDICIONAL FALTANTE ---

    @Test
    void testLongConstructorWithNullId() {
        JwtResponse response = new JwtResponse("token123", (Long) null, "user1", List.of("USER"));
        
        assertEquals("token123", response.getToken());
        assertNull(response.getId());
        assertEquals("user1", response.getUsername());
    }

    @Test
    void testToString() {
        JwtResponse response = new JwtResponse("token123", 1, "user1", List.of("ADMIN"));
        response.setRequiresTwoFactor(true);
        
        String str = response.toString();
        
        assertTrue(str.contains("token=token123"));
        assertTrue(str.contains("type=Bearer"));
        assertTrue(str.contains("id=1"));
        assertTrue(str.contains("username=user1"));
        assertTrue(str.contains("roles=[ADMIN]"));
        assertTrue(str.contains("requiresTwoFactor=true"));
    }
}