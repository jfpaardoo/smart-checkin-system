package org.springframework.samples.smartcheckin.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de emisión y consumo de tickets WebSocket de corta duración (SEC-07).
 * Previene la fuga de tokens JWT de larga duración a través de conexiones STOMP
 * o encabezados/URLs registrados en logs intermedios.
 */
@Service
public class WebSocketTicketService {

    private static final Logger log = LoggerFactory.getLogger(WebSocketTicketService.class);
    private static final long TICKET_TTL_SECONDS = 60; // 60 segundos
    private static final int MAX_PENDING_TICKETS = 10_000;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, TicketItem> ticketStore = new ConcurrentHashMap<>();

    public record TicketItem(
            String ticket,
            String username,
            Instant expiresAt
    ) {}

    /**
     * Genera un ticket unívoco y criptográfico asociado al usuario autenticado.
     */
    public String generateTicket(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username no puede ser nulo o vacío para generar ticket WebSocket");
        }

        cleanExpiredTickets();

        if (ticketStore.size() >= MAX_PENDING_TICKETS) {
            ticketStore.clear();
        }

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String ticket = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        ticketStore.put(ticket, new TicketItem(
                ticket,
                username,
                Instant.now().plusSeconds(TICKET_TTL_SECONDS)
        ));

        log.debug("Ticket WebSocket emitido para usuario '{}' (TTL: {}s)", username, TICKET_TTL_SECONDS);
        return ticket;
    }

    /**
     * Valida y consume el ticket de forma atómica (un solo uso).
     */
    public Optional<String> validateAndConsumeTicket(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            return Optional.empty();
        }

        TicketItem item = ticketStore.remove(ticket.trim());
        if (item == null) {
            log.warn("Intento de conexión WebSocket con ticket no existente o previamente consumido");
            return Optional.empty();
        }

        if (Instant.now().isAfter(item.expiresAt())) {
            log.warn("Intento de conexión WebSocket con ticket expirado para el usuario '{}'", item.username());
            return Optional.empty();
        }

        log.info("Ticket WebSocket consumido exitosamente para usuario '{}'", item.username());
        return Optional.of(item.username());
    }

    private void cleanExpiredTickets() {
        Instant now = Instant.now();
        ticketStore.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
    }
}
