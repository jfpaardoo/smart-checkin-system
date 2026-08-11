package org.springframework.samples.smartcheckin.notifications;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.exports.EmailService;

import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class NotificationTests {

    private EmailService emailService;
    private SimpMessagingTemplate messagingTemplate;

    private EmailNotificationSender emailSender;
    private PushNotificationSender pushSender;

    @BeforeEach
    void setUp() {
        emailService = mock(EmailService.class);
        messagingTemplate = mock(SimpMessagingTemplate.class);

        emailSender = new EmailNotificationSender(emailService);
        pushSender = new PushNotificationSender(messagingTemplate);
    }

    @Test
    void testEmailNotificationSender() {
        emailSender.send("test@example.com", "Subject", "Body");
        verify(emailService, times(1)).sendEmailWithAttachment("test@example.com", "Subject", "Body", null, null);
    }

    @Test
    void testPushNotificationSender() {
        pushSender.send("/topic/test", "Subject", "Body");
        verify(messagingTemplate, times(1)).convertAndSend("/topic/test", "Body");
    }

    @Test
    void testPushNotificationSenderException() {
        doThrow(new RuntimeException("Simulated error")).when(messagingTemplate).convertAndSend(anyString(), any(Object.class));
        pushSender.send("/topic/test", "Subject", "Body");
        verify(messagingTemplate, times(1)).convertAndSend("/topic/test", "Body");
    }

    @Test
    void testAlertNotification() {
        Notification alert = new AlertNotification(emailSender, "Anomaly detected");
        alert.notify("admin@example.com");
        verify(emailService, times(1)).sendEmailWithAttachment("admin@example.com", "Aviso del Sistema", "ATENCIÓN: Anomaly detected", null, null);
    }

    @Test
    void testAuthNotification() {
        Notification auth = new AuthNotification(pushSender, "User logged in");
        auth.notify("user123");
        verify(messagingTemplate, times(1)).convertAndSend("user123", "Se ha detectado un nuevo inicio de sesión en tu cuenta: User logged in");
    }

    @Test
    void testTwoFactorNotification() {
        Notification twoFactor = new TwoFactorNotification(emailSender, "123456");
        twoFactor.notify("user@example.com");
        verify(emailService, times(1)).sendEmailWithAttachment("user@example.com", "Código de Verificación 2FA", "Tu código de verificación de 2 factores es: 123456", null, null);
    }

    @Test
    void testSystemUpdateNotification() {
        Notification update = new SystemUpdateNotification(pushSender, "UPDATED");
        update.notify("/topic/formations");
        verify(messagingTemplate, times(1)).convertAndSend("/topic/formations", "UPDATED");
    }
}
