package org.springframework.samples.smartcheckin.exports;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class EmailServiceTests {

    private static final String TEST_EMAIL = "test@test.com";
    private static final String SUBJECT = "Subject";

    @Mock
    private JavaMailSender javaMailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "fromEmail", "test@domain.com");
    }

    @Test
    void shouldSendEmailWithAttachment() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        byte[] attachmentBytes = new byte[]{1, 2, 3};
        emailService.sendEmailWithAttachment(TEST_EMAIL, SUBJECT, "Body", attachmentBytes, "test.pdf");

        verify(javaMailSender, times(1)).send(mimeMessage);
    }

    @Test
    void shouldSendEmailWithoutAttachmentWhenBytesAreNull() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendEmailWithAttachment(TEST_EMAIL, SUBJECT, "Body", null, "test.pdf");

        verify(javaMailSender, times(1)).send(mimeMessage);
    }

    @Test
    void shouldSendEmailWithoutAttachmentWhenFilenameIsNull() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        byte[] attachmentBytes = new byte[]{1, 2, 3};
        emailService.sendEmailWithAttachment(TEST_EMAIL, SUBJECT, "Body", attachmentBytes, null);

        verify(javaMailSender, times(1)).send(mimeMessage);
    }

    @Test
    void shouldHandleMessagingException() throws Exception {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
        

        doThrow(new MessagingException("Simulated Messaging Exception"))
            .when(mimeMessage).setSubject(anyString()); 

        emailService.sendEmailWithAttachment(TEST_EMAIL, SUBJECT, "Body", null, null);

        verify(javaMailSender, never()).send(any(MimeMessage.class));
        assertTrue(true);
    }
}
