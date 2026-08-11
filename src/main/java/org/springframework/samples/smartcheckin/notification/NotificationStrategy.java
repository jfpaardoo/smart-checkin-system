package org.springframework.samples.smartcheckin.notification;

import org.springframework.samples.smartcheckin.user.User;

public interface NotificationStrategy {
    void sendNotification(User user, String title, String message);
}
