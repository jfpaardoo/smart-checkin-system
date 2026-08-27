package org.springframework.samples.smartcheckin.notification;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@SuppressWarnings("null")
public class WebhookIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(WebhookIntegrationService.class);

    private final RestTemplate restTemplate;

    @Value("${app.webhook.url:}")
    private String genericWebhookUrl;

    @Value("${app.webhook.teams-url:}")
    private String teamsWebhookUrl;

    @Value("${app.webhook.slack-url:}")
    private String slackWebhookUrl;

    public WebhookIntegrationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Async
    public void sendFormationClosedNotification(Formation formation, int attendeeCount) {
        String title = "🎓 Formación Finalizada y Cerrada: " + formation.getName();
        String message = String.format(
            "La formación '%s' ha sido completada y certificada oficialmente.\n- Formador: %s\n- Ubicación: %s\n- Total Asistentes: %d\n- Fecha: %s",
            formation.getName(),
            formation.getTrainer() != null ? formation.getTrainer() : "No especificado",
            formation.getLocation() != null ? formation.getLocation() : "No especificado",
            attendeeCount,
            formation.getFormationDate() != null ? formation.getFormationDate().toString() : "N/A"
        );

        dispatchToConfiguredWebhooks("FORMATION_CLOSED", title, message, Map.of(
            "formationId", formation.getId() != null ? formation.getId() : 0,
            "formationName", formation.getName(),
            "attendees", attendeeCount
        ));
    }

    @Async
    public void sendSecurityAnomalyNotification(String eventType, String details, String ip) {
        String title = "Alerta de Seguridad / Anomalía de Fichaje (" + eventType + ")";
        String message = String.format("Se ha registrado una anomalía de seguridad.\n- Evento: %s\n- IP Origen: %s\n- Detalles: %s",
            eventType, ip != null ? ip : "Desconocida", details);

        dispatchToConfiguredWebhooks("SECURITY_ANOMALY", title, message, Map.of(
            "eventType", eventType,
            "ip", ip != null ? ip : "",
            "details", details
        ));
    }

    private void dispatchToConfiguredWebhooks(String event, String title, String text, Map<String, Object> metadata) {
        if (genericWebhookUrl != null && !genericWebhookUrl.isBlank()) {
            sendGenericWebhook(genericWebhookUrl, event, title, text, metadata);
        }
        if (teamsWebhookUrl != null && !teamsWebhookUrl.isBlank()) {
            sendTeamsWebhook(teamsWebhookUrl, title, text);
        }
        if (slackWebhookUrl != null && !slackWebhookUrl.isBlank()) {
            sendSlackWebhook(slackWebhookUrl, title, text);
        }
    }

    private void sendGenericWebhook(String url, String event, String title, String text, Map<String, Object> metadata) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", event);
            payload.put("title", title);
            payload.put("message", text);
            payload.put("timestamp", java.time.Instant.now().toString());
            payload.put("data", metadata);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(url, request, String.class);
            logger.info("Generic Webhook notification dispatched to: {}", url);
        } catch (Exception e) {
            logger.warn("Failed to dispatch generic webhook to {}: {}", url, e.getMessage());
        }
    }

    private void sendTeamsWebhook(String url, String title, String text) {
        try {
            // Adaptive Card / MessageCard format for Microsoft Teams
            Map<String, Object> payload = new HashMap<>();
            payload.put("@type", "MessageCard");
            payload.put("@context", "http://schema.org/extensions");
            payload.put("themeColor", "0076D7");
            payload.put("summary", title);
            payload.put("title", title);
            payload.put("text", text.replace("\n", "<br/>"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(url, request, String.class);
            logger.info("MS Teams Webhook notification dispatched successfully");
        } catch (Exception e) {
            logger.warn("Failed to dispatch MS Teams webhook: {}", e.getMessage());
        }
    }

    private void sendSlackWebhook(String url, String title, String text) {
        try {
            // Slack Incoming Webhook format
            Map<String, Object> payload = new HashMap<>();
            payload.put("text", "*" + title + "*\n" + text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(url, request, String.class);
            logger.info("Slack Webhook notification dispatched successfully");
        } catch (Exception e) {
            logger.warn("Failed to dispatch Slack webhook: {}", e.getMessage());
        }
    }
}
