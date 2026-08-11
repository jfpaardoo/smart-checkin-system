package org.springframework.samples.smartcheckin.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.push.PushNotificationService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.stereotype.Service;

@Service
public class PushNotificationStrategy implements NotificationStrategy {

    private final PushNotificationService pushNotificationService;

    @Autowired
    public PushNotificationStrategy(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @Override
    public void sendNotification(User user, String title, String message) {
        if (Boolean.TRUE.equals(user.getPushNotificationsEnabled())) {
            pushNotificationService.sendToUser(user, title, message);
        }
    }
}
