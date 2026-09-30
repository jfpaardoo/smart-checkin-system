package org.springframework.samples.smartcheckin.notification;

public class TwoFactorNotification extends Notification {
    
    private final String code;
    
    public TwoFactorNotification(NotificationSender sender, String code) {
        super(sender);
        this.code = code;
    }

    @Override
    public void notify(String recipient) {
        String subject = "Código de Verificación 2FA";
        String message = "Tu código de verificación de 2 factores es: " + code;
        
        if (sender != null) {
            sender.send(recipient, subject, message);
        }
    }
}
