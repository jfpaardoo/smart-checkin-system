package org.springframework.samples.smartcheckin.totp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class TotpBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(TotpBroadcastService.class);

    private final TotpService totpService;
    private final SimpMessagingTemplate messagingTemplate;

    private String lastBroadcastedToken = null;

    @Autowired
    public TotpBroadcastService(TotpService totpService, SimpMessagingTemplate messagingTemplate) {
        this.totpService = totpService;
        this.messagingTemplate = messagingTemplate;
    }

    // Se ejecuta cada 1000ms para verificar y emitir la señal de sincronización cuando cambia el ciclo TOTP
    @Scheduled(fixedRate = 1000)
    public void broadcastTokenIfChanged() {
        try {
            String currentToken = totpService.getCurrentToken();
            if (currentToken != null && !currentToken.equals(lastBroadcastedToken)) {
                log.debug("Nuevo ciclo de token TOTP generado. Emitiendo pulso de sincronización por WebSocket.");
                
                Map<String, Object> payload = new HashMap<>();
                payload.put("event", "TOTP_TICK");
                payload.put("timestamp", System.currentTimeMillis());
                
                messagingTemplate.convertAndSend("/topic/totp", payload);
                lastBroadcastedToken = currentToken;
            }
        } catch (Exception e) {
            log.error("Error al emitir la señal de sincronización TOTP por WebSocket", e);
        }
    }
}
