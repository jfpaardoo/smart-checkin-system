package org.springframework.samples.smartcheckin.push;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.samples.smartcheckin.configuration.jwt.AuthEntryPointJwt;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

@SuppressWarnings("null")
@WebMvcTest(PushNotificationController.class)
class PushNotificationControllerTests {

    private static final String SUBSCRIBE_URL = "/api/v1/push/subscribe";
    private static final String FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send/abc123";
    private static final String TEST_ENDPOINT = "https://endpoint.com";
    private static final String P256DH_KEY = "p256dh";
    private static final String SUBSCRIPTION_JSON_BODY = """
            {
                "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2",
                    "auth": "tBHItJI5svbpC7htfgIZAw"
                }
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PushSubscriptionRepository subscriptionRepository;

    @MockitoBean
    private PushNotificationService pushNotificationService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtUtils jwtUtils;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private AuthEntryPointJwt authEntryPointJwt;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1);
        testUser.setUsername("testuser");
    }

    @Test
    @WithMockUser(username = "testuser")
    void getVapidKeyreturnsPublicKey() throws Exception {
        when(pushNotificationService.getVapidPublicKey()).thenReturn("testVapidPublicKey123");

        mockMvc.perform(get("/api/v1/push/vapid-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicKey").value("testVapidPublicKey123"));
    }

    @Test
    void getVapidKeyunauthenticatedreturns401() throws Exception {
        mockMvc.perform(get("/api/v1/push/vapid-key"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void subscribesavesNewSubscription() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);
        when(subscriptionRepository.findByEndpoint(anyString())).thenReturn(List.of());

        mockMvc.perform(post(SUBSCRIBE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(SUBSCRIPTION_JSON_BODY))
                .andExpect(status().isOk());

        verify(subscriptionRepository).save(any(PushSubscriptionEntity.class));
    }

    @Test
    @WithMockUser(username = "testuser")
    void subscribeduplicateEndpointskipsSave() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);

        PushSubscriptionEntity existing = new PushSubscriptionEntity();
        existing.setEndpoint(FCM_ENDPOINT);
        existing.setUser(testUser);
        when(subscriptionRepository.findByEndpoint(FCM_ENDPOINT))
            .thenReturn(List.of(existing));

        mockMvc.perform(post(SUBSCRIBE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(SUBSCRIPTION_JSON_BODY))
                .andExpect(status().isOk());

        // Al ser el mismo usuario y haber un solo registro, no guarda duplicado ni borra
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @WithMockUser(username = "testuser")
    void unsubscribedeletesSubscription() throws Exception {
        String body = "{\"endpoint\": \"" + FCM_ENDPOINT + "\"}";

        mockMvc.perform(post("/api/v1/push/unsubscribe")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());

        verify(subscriptionRepository).deleteByEndpoint(FCM_ENDPOINT);
    }

    @Test
    void subscribeunauthenticatedreturns401() throws Exception {
        mockMvc.perform(post(SUBSCRIBE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(SUBSCRIPTION_JSON_BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void testSubscribeExistingEndpointWithDuplicatesShouldDeleteDuplicates() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);

        PushSubscriptionEntity sub1 = new PushSubscriptionEntity();
        sub1.setId(10);
        sub1.setEndpoint(TEST_ENDPOINT);
        sub1.setUser(testUser);

        PushSubscriptionEntity sub2 = new PushSubscriptionEntity();
        sub2.setId(11);
        sub2.setEndpoint(TEST_ENDPOINT);

        PushSubscriptionEntity sub3 = new PushSubscriptionEntity();
        sub3.setId(12);
        sub3.setEndpoint(TEST_ENDPOINT);

        when(subscriptionRepository.findByEndpoint(TEST_ENDPOINT)).thenReturn(List.of(sub1, sub2, sub3));

        PushSubscriptionDTO dto = new PushSubscriptionDTO();
        dto.setEndpoint(TEST_ENDPOINT);
        PushSubscriptionDTO.Keys keys = new PushSubscriptionDTO.Keys();
        keys.setAuth("auth");
        keys.setP256dh(P256DH_KEY);
        dto.setKeys(keys);

        mockMvc.perform(post(SUBSCRIBE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(subscriptionRepository, times(1)).delete(sub2);
        verify(subscriptionRepository, times(1)).delete(sub3);
    }

    @Test
    @WithMockUser(username = "testuser")
    void testSubscribeExistingEndpointWithNullUserShouldTransferUser() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);

        PushSubscriptionEntity existingSub = new PushSubscriptionEntity();
        existingSub.setEndpoint(TEST_ENDPOINT);
        existingSub.setUser(null);

        when(subscriptionRepository.findByEndpoint(TEST_ENDPOINT)).thenReturn(List.of(existingSub));

        PushSubscriptionDTO dto = new PushSubscriptionDTO();
        dto.setEndpoint(TEST_ENDPOINT);
        PushSubscriptionDTO.Keys keys = new PushSubscriptionDTO.Keys();
        keys.setAuth("auth");
        keys.setP256dh(P256DH_KEY);
        dto.setKeys(keys);

        mockMvc.perform(post(SUBSCRIBE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(subscriptionRepository, times(1)).save(existingSub);
        assertEquals(testUser, existingSub.getUser());
    }

    @Test
    @WithMockUser(username = "testuser")
    void testSubscribeExistingEndpointWithDifferentUserShouldTransferUser() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);

        User oldUser = new User();
        oldUser.setId(99);

        PushSubscriptionEntity existingSub = new PushSubscriptionEntity();
        existingSub.setEndpoint(TEST_ENDPOINT);
        existingSub.setUser(oldUser);

        when(subscriptionRepository.findByEndpoint(TEST_ENDPOINT)).thenReturn(List.of(existingSub));

        PushSubscriptionDTO dto = new PushSubscriptionDTO();
        dto.setEndpoint(TEST_ENDPOINT);
        PushSubscriptionDTO.Keys keys = new PushSubscriptionDTO.Keys();
        keys.setAuth("auth");
        keys.setP256dh(P256DH_KEY);
        dto.setKeys(keys);

        mockMvc.perform(post(SUBSCRIBE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(subscriptionRepository, times(1)).save(existingSub);
        assertEquals(testUser, existingSub.getUser());
    }
}