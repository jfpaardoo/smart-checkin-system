package org.springframework.samples.smartcheckin.notifications;

public class AlertNotification extends Notification {
    
    private final String alertMessage;
    
    public AlertNotification(NotificationSender sender, String alertMessage) {
        super(sender);
        this.alertMessage = alertMessage;
    }

    @Override
    public void notify(String recipient) {
        String subject = "Aviso del Sistema";
        String message = "ATENCIÓN: " + alertMessage;
        
        if (sender != null) {
            sender.send(recipient, subject, message);
        }
    }
}
