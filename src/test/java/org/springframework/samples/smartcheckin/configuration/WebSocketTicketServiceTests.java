package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class WebSocketTicketServiceTests {

    private WebSocketTicketService service;

    @BeforeEach
    void setUp() {
        service = new WebSocketTicketService();
    }

    @Test
    void testGenerateAndConsumeTicketSuccessfully() {
        String ticket = service.generateTicket("test_user");
        assertNotNull(ticket);
        assertFalse(ticket.isBlank());

        Optional<String> userOpt = service.validateAndConsumeTicket(ticket);
        assertTrue(userOpt.isPresent());
        assertEquals("test_user", userOpt.get());

        // Single-use: consuming again must return empty
        Optional<String> replayOpt = service.validateAndConsumeTicket(ticket);
        assertTrue(replayOpt.isEmpty());
    }

    @Test
    void testValidateInvalidOrNullTicket() {
        assertTrue(service.validateAndConsumeTicket(null).isEmpty());
        assertTrue(service.validateAndConsumeTicket("").isEmpty());
        assertTrue(service.validateAndConsumeTicket("invalid-ticket").isEmpty());
    }

    @Test
    void testGenerateTicketWithNullUsernameThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> service.generateTicket(null));
        assertThrows(IllegalArgumentException.class, () -> service.generateTicket("  "));
    }
}
