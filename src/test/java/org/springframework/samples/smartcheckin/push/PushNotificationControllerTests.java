package org.springframework.samples.smartcheckin.push;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

@SuppressWarnings("null")
@WebMvcTest(PushNotificationController.class)
class PushNotificationControllerTests {

    @Autowired
    private MockMvc mockMvc;

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
    void getVapidKey_returnsPublicKey() throws Exception {
        when(pushNotificationService.getVapidPublicKey()).thenReturn("testVapidPublicKey123");

        mockMvc.perform(get("/api/v1/push/vapid-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicKey").value("testVapidPublicKey123"));
    }

    @Test
    void getVapidKey_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/push/vapid-key"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void subscribe_savesNewSubscription() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);
        when(subscriptionRepository.findByEndpoint(anyString())).thenReturn(List.of());

        String body = """
            {
                "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2",
                    "auth": "tBHItJI5svbpC7htfgIZAw"
                }
            }
            """;

        mockMvc.perform(post("/api/v1/push/subscribe")
                .with(csrf()) // Soluciona el error 403 Forbidden
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());

        verify(subscriptionRepository).save(any(PushSubscriptionEntity.class));
    }

    @Test
    @WithMockUser(username = "testuser")
    void subscribe_duplicateEndpoint_skipsSave() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);

        PushSubscriptionEntity existing = new PushSubscriptionEntity();
        existing.setEndpoint("https://fcm.googleapis.com/fcm/send/abc123");
        existing.setUser(testUser);
        when(subscriptionRepository.findByEndpoint("https://fcm.googleapis.com/fcm/send/abc123"))
            .thenReturn(List.of(existing));

        String body = """
            {
                "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2",
                    "auth": "tBHItJI5svbpC7htfgIZAw"
                }
            }
            """;

        mockMvc.perform(post("/api/v1/push/subscribe")
                .with(csrf()) // Soluciona el error 403 Forbidden
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());

        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @WithMockUser(username = "testuser")
    void unsubscribe_deletesSubscription() throws Exception {
        String body = "{\"endpoint\": \"https://fcm.googleapis.com/fcm/send/abc123\"}";

        mockMvc.perform(post("/api/v1/push/unsubscribe")
                .with(csrf()) // Soluciona el error 403 Forbidden
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());

        verify(subscriptionRepository).deleteByEndpoint("https://fcm.googleapis.com/fcm/send/abc123");
    }

    @Test
    void subscribe_unauthenticated_returns401() throws Exception {
        String body = """
            {
                "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2",
                    "auth": "tBHItJI5svbpC7htfgIZAw"
                }
            }
            """;

        mockMvc.perform(post("/api/v1/push/subscribe")
                .with(csrf()) // Evita que salte el 403 CSRF antes que el 401 Unauthorized
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isUnauthorized());
    }
}
