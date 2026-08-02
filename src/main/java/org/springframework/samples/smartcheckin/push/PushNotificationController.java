package org.springframework.samples.smartcheckin.push;

import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/push")
@Slf4j
public class PushNotificationController {

    private final PushSubscriptionRepository subscriptionRepository;
    private final PushNotificationService pushNotificationService;
    private final UserService userService;

    public PushNotificationController(PushSubscriptionRepository subscriptionRepository,
                                       PushNotificationService pushNotificationService,
                                       UserService userService) {
        this.subscriptionRepository = subscriptionRepository;
        this.pushNotificationService = pushNotificationService;
        this.userService = userService;
    }

    /**
     * Returns the VAPID public key so the browser can subscribe to push.
     */
    @GetMapping("/vapid-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushNotificationService.getVapidPublicKey()));
    }

    /**
     * Saves a push subscription for the authenticated user.
     */
    @PostMapping("/subscribe")
    @Transactional
    public ResponseEntity<Void> subscribe(@RequestBody PushSubscriptionDTO dto) {
        User user = userService.findCurrentUser();

        // Avoid duplicate subscriptions for the same endpoint
        if (subscriptionRepository.findByEndpoint(dto.getEndpoint()).isPresent()) {
            return ResponseEntity.ok().build();
        }

        PushSubscriptionEntity entity = new PushSubscriptionEntity();
        entity.setUser(user);
        entity.setEndpoint(dto.getEndpoint());
        entity.setP256dh(dto.getKeys().getP256dh());
        entity.setAuth(dto.getKeys().getAuth());
        subscriptionRepository.save(entity);

        log.info("Push subscription saved for user: {}", user.getUsername());
        return ResponseEntity.ok().build();
    }

    /**
     * Removes a push subscription (e.g. user unsubscribes or logs out).
     */
    @PostMapping("/unsubscribe")
    @Transactional
    public ResponseEntity<Void> unsubscribe(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        subscriptionRepository.deleteByEndpoint(endpoint);
        return ResponseEntity.ok().build();
    }
}
