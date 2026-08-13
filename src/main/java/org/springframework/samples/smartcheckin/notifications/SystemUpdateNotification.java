package org.springframework.samples.smartcheckin.notifications;

public class SystemUpdateNotification extends Notification {
    
    private final String updatePayload;
    
    public SystemUpdateNotification(NotificationSender sender, String updatePayload) {
        super(sender);
        this.updatePayload = updatePayload;
    }

    @Override
    public void notify(String topic) {
        String subject = "System Update";
        // The topic acts as the recipient, and the updatePayload is the message content
        if (sender != null) {
            sender.send(topic, subject, updatePayload);
        }
    }
}
