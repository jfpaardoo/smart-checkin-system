package org.springframework.samples.smartcheckin.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.push.PushNotificationService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@SuppressWarnings("null")
@Component
public class PushNotificationSender implements NotificationSender {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationSender.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final PushNotificationService pushNotificationService;
    private final UserRepository userRepository;

    public PushNotificationSender(SimpMessagingTemplate messagingTemplate) {
        this(messagingTemplate, null, null);
    }

    @Autowired
    public PushNotificationSender(SimpMessagingTemplate messagingTemplate,
                                  @Autowired(required = false) PushNotificationService pushNotificationService,
                                  @Autowired(required = false) UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.pushNotificationService = pushNotificationService;
        this.userRepository = userRepository;
    }

    @Override
    public void send(String to, String subject, String message) {
        logger.info(">>> PUSH NOTIFICATION ENVIADA A {}: [{}] {}", to, subject, message);
        try {
            // 1. Enviar evento en tiempo real por WebSocket (STOMP)
            if (to != null && to.startsWith("/topic/")) {
                messagingTemplate.convertAndSend(to, message);
            } else if (to != null) {
                // Notificación directa al canal privado del usuario
                messagingTemplate.convertAndSend("/topic/notifications/" + to, message);
            }
        } catch (Exception e) {
            logger.error("Error sending websocket notification to {}", to, e);
        }

        // 2. Enviar WebPush nativo al navegador (ServiceWorker VAPID)
        try {
            if (pushNotificationService != null && userRepository != null && to != null && !to.startsWith("/topic/")) {
                Optional<User> userOpt = userRepository.findByUsername(to);
                userOpt.ifPresent(user -> pushNotificationService.sendToUser(user, subject, message));
            }
        } catch (Exception e) {
            logger.warn("Error sending browser webpush notification to user {}: {}", to, e.getMessage());
        }
    }
}
