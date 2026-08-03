package org.springframework.samples.smartcheckin.push;

import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Optional;

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

        // If the browser (endpoint) is already subscribed, update the user it belongs to
        // This is crucial for when different users log in on the same browser
        Optional<PushSubscriptionEntity> existingOpt = subscriptionRepository.findByEndpoint(dto.getEndpoint());
        if (existingOpt.isPresent()) {
            PushSubscriptionEntity existing = existingOpt.get();
            if (existing.getUser() == null || !existing.getUser().getId().equals(user.getId())) {
                existing.setUser(user);
                subscriptionRepository.save(existing);
                log.info("Push subscription transferred to user: {}", user.getUsername());
            }
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
