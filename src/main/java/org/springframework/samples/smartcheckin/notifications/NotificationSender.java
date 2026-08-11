package org.springframework.samples.smartcheckin.notifications;

public interface NotificationSender {
    void send(String to, String subject, String message);
}
