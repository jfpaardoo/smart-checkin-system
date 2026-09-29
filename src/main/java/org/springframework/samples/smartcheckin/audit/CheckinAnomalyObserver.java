package org.springframework.samples.smartcheckin.audit;

import org.jpatterns.gof.ObserverPattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.statistics.events.CheckinEvent;
import org.springframework.samples.smartcheckin.checkin.CheckinService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.samples.smartcheckin.notifications.EmailNotificationSender;
import org.springframework.samples.smartcheckin.notifications.PushNotificationSender;
import org.springframework.samples.smartcheckin.notifications.AlertNotification;
import org.springframework.samples.smartcheckin.notifications.Notification;
import org.springframework.samples.smartcheckin.metrics.AppMetricsService;
import org.springframework.samples.smartcheckin.notification.WebhookIntegrationService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;

@Component
@ObserverPattern.Observer
public class CheckinAnomalyObserver {

    private static final Logger logger = LoggerFactory.getLogger(CheckinAnomalyObserver.class);
    private final AuditService auditService;
    private final CheckinRepository checkinRepository;
    private final EmailNotificationSender emailNotificationSender;
    private AppMetricsService metricsService;
    private WebhookIntegrationService webhookIntegrationService;
    private PushNotificationSender pushNotificationSender;
    private UserService userService;

    @Autowired
    public CheckinAnomalyObserver(AuditService auditService, CheckinRepository checkinRepository, EmailNotificationSender emailNotificationSender) {
        this.auditService = auditService;
        this.checkinRepository = checkinRepository;
        this.emailNotificationSender = emailNotificationSender;
    }

    @Autowired(required = false)
    public void setWebhookIntegrationService(WebhookIntegrationService webhookIntegrationService) {
        this.webhookIntegrationService = webhookIntegrationService;
    }

    @Autowired(required = false)
    public void setMetricsService(AppMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Autowired(required = false)
    public void setPushNotificationSender(PushNotificationSender pushNotificationSender) {
        this.pushNotificationSender = pushNotificationSender;
    }

    @Autowired(required = false)
    public void setUserService(UserService userService) {
        this.userService = userService;
    }

    @EventListener
    @Transactional
    public void onCheckinEvent(CheckinEvent event) {
        // Anomaly logic: if a user checks in too many times within the last 5 minutes.
        // We will just do a simple check.
        
        Object source = event.getSource();
        if (source instanceof CheckinService) {
            // CheckinService does not provide the checkin directly in the event, but we can search recent checkins.
            // For simplicity, we just look for any anomaly in the last 5 minutes across all users.
            // This is just a prototype anomaly check
            try {
                // Here we could implement advanced logic. Let's assume we find an anomaly if there's > 10 checkins globally in 5 mins
                long count = checkinRepository.count(); // Placeholder logic
                if (count > 10000) { // arbitrary condition
                    logAnomaly("High volume of checkins detected globally.");
                }
            } catch (Exception e) {
                logger.error("Failed to process anomaly check", e);
            }
        }
    }

    private void logAnomaly(String details) {
        recordAuditAndMetrics(details);
        sendWebhookAlert(details);
        sendEmailAlert(details);
        sendAdminPushAlert(details);
    }

    private void recordAuditAndMetrics(String details) {
        AuditLog log = new AuditLog("SECURITY_ANOMALY", "system", details, "127.0.0.1");
        auditService.recordAuditLog(log);
        if (metricsService != null) {
            metricsService.incrementCheckinAnomaly();
        }
        logger.warn("Security Anomaly Logged: {}", details);
    }

    private void sendWebhookAlert(String details) {
        if (webhookIntegrationService != null) {
            webhookIntegrationService.sendSecurityAnomalyNotification("CHECKIN_ANOMALY", details, "127.0.0.1");
        }
    }

    private void sendEmailAlert(String details) {
        Notification alert = new AlertNotification(emailNotificationSender, details);
        alert.notify("admin@smartcheckin.com");
    }

    private void sendAdminPushAlert(String details) {
        if (pushNotificationSender == null) {
            return;
        }
        if (userService == null) {
            pushNotificationSender.send("admin", "Anomalía en Fichajes", details);
            return;
        }
        try {
            Iterable<User> admins = userService.findAllByAuthority("ADMIN");
            if (admins == null) {
                return;
            }
            for (User admin : admins) {
                if (admin.getUsername() != null && !admin.getUsername().startsWith("GDPR_DEL_")) {
                    pushNotificationSender.send(admin.getUsername(), "Anomalía en Fichajes", details);
                }
            }
        } catch (Exception e) {
            logger.warn("Error enviando push de anomalía de check-in a admins: {}", e.getMessage());
        }
    }
}
