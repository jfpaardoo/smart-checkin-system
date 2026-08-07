package org.springframework.samples.smartcheckin.push;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.util.Base64;
import java.util.List;
import java.util.Collections;

import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECNamedCurveGenParameterSpec;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.test.util.ReflectionTestUtils;

import nl.martijndwars.webpush.PushService;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PushNotificationServiceTests {

    @Mock
    private PushSubscriptionRepository subscriptionRepository;

    @Mock
    private PushService pushService;

    @InjectMocks
    private PushNotificationService pushNotificationService;

    private static String VALID_P256DH;
    private static String VALID_AUTH;

    @BeforeAll
    static void beforeAll() throws Exception {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        
        // Generar dinámicamente un punto de curva elíptica matemáticamente válido
        // para que la librería web-push no explote al inicializar "Notification"
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("ECDSA", "BC");
        kpg.initialize(new ECNamedCurveGenParameterSpec("prime256v1"));
        KeyPair kp = kpg.generateKeyPair();
        byte[] pubKey = ((ECPublicKey) kp.getPublic()).getQ().getEncoded(false);
        VALID_P256DH = Base64.getUrlEncoder().withoutPadding().encodeToString(pubKey);
        
        // Generar auth secreto de 16 bytes
        byte[] auth = new byte[16];
        VALID_AUTH = Base64.getUrlEncoder().withoutPadding().encodeToString(auth);
    }

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(pushNotificationService, "vapidPublicKey", "testPublicKey");
        ReflectionTestUtils.setField(pushNotificationService, "vapidPrivateKey", "testPrivateKey");
        ReflectionTestUtils.setField(pushNotificationService, "pushService", pushService);
    }

    @Test
    void getVapidPublicKeyReturnsConfiguredKey() {
        assertEquals("testPublicKey", pushNotificationService.getVapidPublicKey());
    }

    @Test
    void sendToUserSendsToAllSubscriptions() {
        User user = new User();
        user.setUsername("testuser");

        PushSubscriptionEntity sub1 = new PushSubscriptionEntity();
        sub1.setEndpoint("https://push.example.com/sub1");
        sub1.setP256dh(VALID_P256DH);
        sub1.setAuth(VALID_AUTH);
        sub1.setUser(user);

        PushSubscriptionEntity sub2 = new PushSubscriptionEntity();
        sub2.setEndpoint("https://push.example.com/sub2");
        sub2.setP256dh(VALID_P256DH);
        sub2.setAuth(VALID_AUTH);
        sub2.setUser(user);

        when(subscriptionRepository.findByUser(user)).thenReturn(List.of(sub1, sub2));

        pushNotificationService.sendToUser(user, "Test Title", "Test Body");

        verify(subscriptionRepository).findByUser(user);
    }

    @Test
    void sendToUserNoSubscriptionsDoesNothing() {
        User user = new User();
        user.setUsername("lonely");

        when(subscriptionRepository.findByUser(user)).thenReturn(Collections.emptyList());

        pushNotificationService.sendToUser(user, "Hello", "World");

        verify(subscriptionRepository).findByUser(user);
        verifyNoMoreInteractions(subscriptionRepository);
    }

    @Test
    void sendNotificationHandlesExceptionGracefully() {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/endpoint123");
        sub.setP256dh(VALID_P256DH);
        sub.setAuth(VALID_AUTH);

        try {
            doThrow(new RuntimeException("Network error")).when(pushService).send(any());
        } catch (Exception e) {
            // Ignorado mock config
        }

        assertDoesNotThrow(() -> 
            pushNotificationService.sendNotification(sub, "Title", "Body"));
    }

    @Test
    void sendNotificationRemoves410Subscription() {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/stale-endpoint");
        sub.setP256dh(VALID_P256DH);
        sub.setAuth(VALID_AUTH);

        try {
            doThrow(new RuntimeException("410 Gone")).when(pushService).send(any());
        } catch (Exception e) {
            // Ignorado mock config
        }

        pushNotificationService.sendNotification(sub, "Title", "Body");

        // Al haber generado claves dinámicas válidas, ahora SÍ llega a ejecutarse el mock y por tanto invoca al borrado
        verify(subscriptionRepository).delete(sub);
    }

    @Test
    void sendNotificationDoesNotRemoveNon410Subscription() {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/valid-endpoint");
        sub.setP256dh(VALID_P256DH);
        sub.setAuth(VALID_AUTH);

        try {
            doThrow(new RuntimeException("503 Service Unavailable")).when(pushService).send(any());
        } catch (Exception e) {
            // Ignorado mock config
        }

        pushNotificationService.sendNotification(sub, "Title", "Body");

        verify(subscriptionRepository, never()).delete(any());
    }

    @Test
    void sendNotificationHandlesNullTitle() {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/null-title");
        sub.setP256dh(VALID_P256DH);
        sub.setAuth(VALID_AUTH);

        try {
            doThrow(new RuntimeException("some error")).when(pushService).send(any());
        } catch (Exception e) {
            // Ignorado mock config
        }

        assertDoesNotThrow(() ->
            pushNotificationService.sendNotification(sub, null, null));
    }

    @Test
    void sendNotificationHandlesInterruptedException() {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://push.example.com/interrupted");
        sub.setP256dh(VALID_P256DH);
        sub.setAuth(VALID_AUTH);

        try {
            doThrow(new InterruptedException("Thread interrupted")).when(pushService).send(any());
        } catch (Exception e) {
            // Ignorado mock config
        }

        pushNotificationService.sendNotification(sub, "Title", "Body");

        // Al ejecutarse con éxito el mock, interceptará correctamente la interrupción.
        assertTrue(Thread.currentThread().isInterrupted());
        Thread.interrupted();
    }

    @Test
    void initProviderAlreadyExistsAndInvalidKeysException() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        PushNotificationService serviceWithBadKeys = new PushNotificationService(subscriptionRepository);
        ReflectionTestUtils.setField(serviceWithBadKeys, "vapidPublicKey", "invalidKey");
        ReflectionTestUtils.setField(serviceWithBadKeys, "vapidPrivateKey", "invalidKey");

        assertDoesNotThrow(serviceWithBadKeys::init);
    }

    @Test
    void testSendNotificationGenericExceptionWithout410() {
        PushSubscriptionEntity sub = new PushSubscriptionEntity();
        sub.setEndpoint("https://fcm.googleapis.com/fcm/send/errorEndpoint");
        sub.setP256dh("p256dh");
        sub.setAuth("auth");

        nl.martijndwars.webpush.PushService mockPushService = mock(nl.martijndwars.webpush.PushService.class);
        try {
            doThrow(new RuntimeException("General Error")).when(mockPushService).send(any());
        } catch (Exception e) {
            // Ignorar
        }

        ReflectionTestUtils.setField(pushNotificationService, "pushService", mockPushService);

        assertDoesNotThrow(() -> pushNotificationService.sendNotification(sub, "Title", "Body"));
        verify(subscriptionRepository, never()).delete(any());
    }
}