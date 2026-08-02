package org.springframework.samples.smartcheckin.push;

import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;

/**
 * Service responsible for sending Web Push notifications to subscribed browsers.
 *
 * <h2>How Web Push + VAPID works (simplified)</h2>
 * <ol>
 *   <li>The server generates a pair of VAPID keys (public + private). The <b>public key</b>
 *       is shared with the browser so it can subscribe via the Push API.</li>
 *   <li>When a user grants permission, the browser contacts Google's FCM / Mozilla's push
 *       servers and returns a {@code PushSubscription} object containing an endpoint URL,
 *       a p256dh key (for encrypting the payload) and an auth secret.</li>
 *   <li>We store that subscription in the database (see {@link PushSubscriptionEntity}).</li>
 *   <li>When we want to notify the user, we build an encrypted payload using the VAPID
 *       private key + the subscription's p256dh/auth, and POST it to the push endpoint.
 *       The push service (Google/Mozilla) then delivers it to the user's Service Worker.</li>
 * </ol>
 */
@Service
@Slf4j
public class PushNotificationService {

    @Value("${vapid.public.key}")
    private String vapidPublicKey;

    @Value("${vapid.private.key}")
    private String vapidPrivateKey;

    private PushService pushService;

    private final PushSubscriptionRepository subscriptionRepository;

    public PushNotificationService(PushSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @PostConstruct
    public void init() throws GeneralSecurityException {
        Security.addProvider(new BouncyCastleProvider());
        pushService = new PushService(vapidPublicKey, vapidPrivateKey);
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    /**
     * Send a push notification to all browsers the given user has subscribed from.
     */
    public void sendToUser(User user, String title, String body) {
        List<PushSubscriptionEntity> subs = subscriptionRepository.findByUser(user);
        for (PushSubscriptionEntity sub : subs) {
            sendNotification(sub, title, body);
        }
    }

    /**
     * Send a push notification to a single subscription.
     */
    public void sendNotification(PushSubscriptionEntity sub, String title, String body) {
        try {
            String payload = String.format("{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/ba-logo-circle.png\"}", 
                escapeJson(title), escapeJson(body));

            Notification notification = new Notification(
                sub.getEndpoint(),
                sub.getP256dh(),
                sub.getAuth(),
                payload
            );

            pushService.send(notification);
            log.info("Push notification sent to endpoint: {}...", sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Push notification interrupted for endpoint {}: {}",
                sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())), e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to send push notification to endpoint {}: {}", 
                sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())), e.getMessage());
            // If the subscription is no longer valid (410 Gone), remove it
            if (e.getMessage() != null && e.getMessage().contains("410")) {
                subscriptionRepository.delete(sub);
                log.info("Removed stale push subscription");
            }
        }
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
