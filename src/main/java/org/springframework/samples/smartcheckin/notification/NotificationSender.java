package org.springframework.samples.smartcheckin.notification;

public interface NotificationSender {
    void send(String to, String subject, String message);
}
