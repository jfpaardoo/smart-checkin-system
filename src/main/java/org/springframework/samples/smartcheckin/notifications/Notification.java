package org.springframework.samples.smartcheckin.notifications;

public abstract class Notification {
    protected NotificationSender sender;
    
    protected Notification(NotificationSender sender) {
        this.sender = sender;
    }
    
    public void setSender(NotificationSender sender) {
        this.sender = sender;
    }
    
    public abstract void notify(String recipient);
}
