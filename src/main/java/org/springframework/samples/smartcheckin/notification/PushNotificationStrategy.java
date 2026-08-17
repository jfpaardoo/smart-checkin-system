package org.springframework.samples.smartcheckin.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.push.PushNotificationService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@SuppressWarnings("null")
public class PushNotificationStrategy implements NotificationStrategy {

    private final PushNotificationService pushNotificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public PushNotificationStrategy(PushNotificationService pushNotificationService,
                                   @Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.pushNotificationService = pushNotificationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void sendNotification(User user, String title, String message) {
        if (user == null || !Boolean.TRUE.equals(user.getPushNotificationsEnabled())) {
            return;
        }

        sendWebSocketAlert(user, title, message);
        sendWebPush(user, title, message);
    }

    private void sendWebSocketAlert(User user, String title, String message) {
        if (messagingTemplate == null) {
            return;
        }
        try {
            String fullMsg = (title != null && !title.isBlank()) ? "[" + title + "] " + message : message;
            if (user.getUsername() != null) {
                messagingTemplate.convertAndSend("/topic/notifications/" + user.getUsername(), fullMsg);
            } else {
                messagingTemplate.convertAndSend("/topic/alerts", fullMsg);
            }
        } catch (Exception e) {
            log.warn("Failed to send live websocket notification to user {}: {}", user.getUsername(), e.getMessage());
        }
    }

    private void sendWebPush(User user, String title, String message) {
        try {
            pushNotificationService.sendToUser(user, title, message);
        } catch (Exception e) {
            log.warn("Failed to send WebPush notification to user {}: {}", user.getUsername(), e.getMessage());
        }
    }
}
