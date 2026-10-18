package org.springframework.samples.smartcheckin.configuration;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint autenticado para solicitar tickets efímeros de conexión a WebSocket (SEC-07).
 */
@RestController
@RequestMapping("/api/v1/ws")
public class WebSocketTicketRestController {

    private final WebSocketTicketService webSocketTicketService;

    public WebSocketTicketRestController(WebSocketTicketService webSocketTicketService) {
        this.webSocketTicketService = webSocketTicketService;
    }

    @PostMapping("/ticket")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> requestTicket(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).build();
        }

        String ticket = webSocketTicketService.generateTicket(authentication.getName());
        return ResponseEntity.ok(Map.of(
                "ticket", ticket,
                "expiresIn", 60
        ));
    }
}
