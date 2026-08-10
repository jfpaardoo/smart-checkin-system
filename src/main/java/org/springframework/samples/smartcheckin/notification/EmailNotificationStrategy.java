package org.springframework.samples.smartcheckin.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailNotificationStrategy implements NotificationStrategy {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:onboarding@resend.dev}")
    private String mailFrom;

    @Autowired
    public EmailNotificationStrategy(JavaMailSender javaMailSender, TemplateEngine templateEngine) {
        this.javaMailSender = javaMailSender;
        this.templateEngine = templateEngine;
    }

    @Async("taskExecutor")
    @Override
    public void sendNotification(User user, String title, String message) {
        String userEmail = user.getEmail();
        if (Boolean.TRUE.equals(user.getEmailNotificationsEnabled()) && userEmail != null) {
            try {
                MimeMessage mimeMessage = javaMailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                String safeMailFrom = mailFrom != null ? mailFrom : "onboarding@resend.dev";
                String safeTitle = title != null ? title : "Notificación de Smart Check-in";
                String safeMessage = message != null ? message : "";

                helper.setFrom(safeMailFrom);
                helper.setTo(userEmail);
                helper.setSubject(safeTitle);

                // Prepare Thymeleaf context
                Context context = new Context();
                context.setVariable("title", safeTitle);
                context.setVariable("message", safeMessage);
                context.setVariable("username", user.getFirstName() != null ? user.getFirstName() : user.getUsername());

                // Process the HTML template
                String htmlContent = templateEngine.process("notification-email", context);
                String safeHtmlContent = htmlContent != null ? htmlContent : "";
                helper.setText(safeHtmlContent, true); // true = isHtml

                javaMailSender.send(mimeMessage);
                log.info("Async email notification sent successfully to {}", userEmail);
            } catch (Exception e) {
                log.error("Failed to send async email notification to {}: {}", userEmail, e.getMessage());
            }
        }
    }
}
