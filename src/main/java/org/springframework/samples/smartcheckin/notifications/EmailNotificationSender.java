package org.springframework.samples.smartcheckin.notifications;

import org.springframework.samples.smartcheckin.exports.EmailService;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationSender implements NotificationSender {
    
    private final EmailService emailService;
    
    public EmailNotificationSender(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void send(String to, String subject, String message) {
        // We pass null for attachment bytes and filename since this basic sender doesn't handle them
        emailService.sendEmailWithAttachment(to, subject, message, null, null);
    }
}
