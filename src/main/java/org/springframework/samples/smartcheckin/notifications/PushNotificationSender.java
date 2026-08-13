package org.springframework.samples.smartcheckin.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@SuppressWarnings("null")
@Component
public class PushNotificationSender implements NotificationSender {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationSender.class);
    private final SimpMessagingTemplate messagingTemplate;

    public PushNotificationSender(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void send(String to, String subject, String message) {
        logger.info(">>> PUSH NOTIFICATION ENVIADA A {}: [{}] {}", to, subject, message);
        try {
            messagingTemplate.convertAndSend(to, message);
        } catch (Exception e) {
            logger.error("Error sending push notification to {}", to, e);
        }
    }
}
