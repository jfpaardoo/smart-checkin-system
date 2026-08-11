package org.springframework.samples.smartcheckin.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationContext {

    private final List<NotificationStrategy> strategies;

    @Autowired
    public NotificationContext(List<NotificationStrategy> strategies) {
        this.strategies = strategies;
    }

    public void sendNotification(User user, String title, String message) {
        for (NotificationStrategy strategy : strategies) {
            strategy.sendNotification(user, title, message);
        }
    }
}
