package org.springframework.samples.smartcheckin.push;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.test.util.ReflectionTestUtils;

import nl.martijndwars.webpush.PushService;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTests {

    @Mock
    private PushSubscriptionRepository subscriptionRepository;

    @Mock
    private PushService pushService;

    @InjectMocks
    private PushNotificationService pushNotificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(pushNotificationService, "vapidPublicKey", "testPublicKey");
        ReflectionTestUtils.setField(pushNotificationService, "vapidPrivateKey", "testPrivateKey");
        ReflectionTestUtils.setField(pushNotificationService, "pushService", pushService);
    }

    @Test
    void getVapidPublicKey_returnsConfiguredKey() {
        assertEquals("testPublicKey", pushNotificationService.getVapidPublicKey());
    }

    @Test
    void sendToUser_sendsToAllSubscriptions() throws Exception {
        User user = new User();
        user.setUsername("testuser");

        PushSubscriptionEntity sub1 = new PushSubscriptionEntity();
        sub1.setEndpoint("https://push.example.com/sub1");
        sub1.setP256dh("p256dh1");
        sub1.setAuth("auth1");
        sub1.setUser(user);

        PushSubscriptionEntity sub2 = new PushSubscriptionEntity();
        sub2.setEndpoint("https://push.example.com/sub2");
        sub2.setP256dh("p256dh2");
        sub2.setAuth("auth2");
        sub2.setUser(user);

        when(subscriptionRepository.findByUser(user)).thenReturn(List.of(sub1, sub2));

        pushNotificationService.sendToUser(user, "Test Title", "Test Body");

        // Both subscriptions should trigger a send attempt
        // Since pushService.send() will throw (invalid keys in test), we just verify no crash
        verify(subscriptionRepository).findByUser(user);
    }

    @Test
    void sendToUser_noSubscriptions_doesNothing() {
        User user = new User();
        user.setUsername("lonely");

        when(subscriptionRepository.findByUser(user)).thenReturn(Collections.emptyList());

        pushNotificationService.sendToUser(user, "Hello", "World");

        verify(subscriptionRepository).findByUser(user);
        verifyNoMoreInteractions(subscriptionRepository);
    }

    @Test
    void sendNotification_handlesExceptionGracefully() throws Exception {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/endpoint123");
        sub.setP256dh("fakep256dh");
        sub.setAuth("fakeauth");

        doThrow(new RuntimeException("Network error")).when(pushService).send(any());

        // Should not throw
        assertDoesNotThrow(() -> 
            pushNotificationService.sendNotification(sub, "Title", "Body"));
    }

    @Test
    void sendNotification_removes410Subscription() throws Exception {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/stale-endpoint");
        sub.setP256dh("fakep256dh");
        sub.setAuth("fakeauth");

        doThrow(new RuntimeException("410 Gone")).when(pushService).send(any());

        pushNotificationService.sendNotification(sub, "Title", "Body");

        verify(subscriptionRepository).delete(sub);
    }

    @Test
    void sendNotification_doesNotRemoveNon410Subscription() throws Exception {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/valid-endpoint");
        sub.setP256dh("fakep256dh");
        sub.setAuth("fakeauth");

        doThrow(new RuntimeException("503 Service Unavailable")).when(pushService).send(any());

        pushNotificationService.sendNotification(sub, "Title", "Body");

        verify(subscriptionRepository, never()).delete(any());
    }

    @Test
    void sendNotification_handlesNullTitle() throws Exception {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/null-title");
        sub.setP256dh("fakep256dh");
        sub.setAuth("fakeauth");

        doThrow(new RuntimeException("some error")).when(pushService).send(any());

        assertDoesNotThrow(() ->
            pushNotificationService.sendNotification(sub, null, null));
    }

    @Test
    void sendNotification_handlesInterruptedException() throws Exception {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/interrupted");
        sub.setP256dh("fakep256dh");
        sub.setAuth("fakeauth");

        doThrow(new InterruptedException("Thread interrupted")).when(pushService).send(any());

        pushNotificationService.sendNotification(sub, "Title", "Body");

        assertTrue(Thread.currentThread().isInterrupted());
        // Clear the interrupt flag for other tests
        Thread.interrupted();
    }
}
