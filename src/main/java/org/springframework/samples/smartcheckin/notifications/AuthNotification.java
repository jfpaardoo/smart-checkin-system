package org.springframework.samples.smartcheckin.notifications;

public class AuthNotification extends Notification {
    
    private final String loginDetails;
    
    public AuthNotification(NotificationSender sender, String loginDetails) {
        super(sender);
        this.loginDetails = loginDetails;
    }

    @Override
    public void notify(String recipient) {
        String subject = "Alerta de Seguridad - Nuevo Inicio de Sesión";
        String message = "Se ha detectado un nuevo inicio de sesión en tu cuenta: " + loginDetails;
        
        if (sender != null) {
            sender.send(recipient, subject, message);
        }
    }
}
