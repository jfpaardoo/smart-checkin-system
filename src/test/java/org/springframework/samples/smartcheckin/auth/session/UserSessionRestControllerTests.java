package org.springframework.samples.smartcheckin.auth.session;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SuppressWarnings({ "null", "java:S1313" })
@WebMvcTest(controllers = UserSessionRestController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class),
        excludeAutoConfiguration = { SecurityAutoConfiguration.class })
class UserSessionRestControllerTests {

    private static final String BASE_URL = "/api/v1/users/me/sessions";
    private static final String SESSION_USER = "sessionUser";
    private static final String CURRENT_JWT = "currentJwt";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserSessionService userSessionService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        User testUser = new User();
        testUser.setId(1);
        testUser.setUsername(SESSION_USER);
        when(userService.findCurrentUser()).thenReturn(testUser);
    }

    @Test
    @WithMockUser(username = SESSION_USER)
    void testGetMyActiveSessions() throws Exception {
        UserSessionDTO dto = UserSessionDTO.builder()
                .id(10)
                .ipAddress("192.168.1.1")
                .deviceInfo("Chrome en Windows")
                .createdAt(LocalDateTime.now(ZoneId.systemDefault()))
                .lastActivityAt(LocalDateTime.now(ZoneId.systemDefault()))
                .isCurrent(true)
                .build();

        when(jwtUtils.getJwtFromCookies(any())).thenReturn(CURRENT_JWT);
        when(userSessionService.getActiveSessions(SESSION_USER, CURRENT_JWT)).thenReturn(List.of(dto));

        mockMvc.perform(get(BASE_URL).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].deviceInfo").value("Chrome en Windows"))
                .andExpect(jsonPath("$[0].current").value(true));
    }

    @Test
    @WithMockUser(username = SESSION_USER)
    void testRevokeSessionSuccess() throws Exception {
        when(userSessionService.revokeSession(SESSION_USER, 10)).thenReturn(true);

        mockMvc.perform(delete(BASE_URL + "/10").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Sesión cerrada correctamente."));
    }

    @Test
    @WithMockUser(username = SESSION_USER)
    void testRevokeSessionNotFound() throws Exception {
        when(userSessionService.revokeSession(SESSION_USER, 99)).thenReturn(false);

        mockMvc.perform(delete(BASE_URL + "/99").with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = SESSION_USER)
    void testRevokeOtherSessions() throws Exception {
        when(jwtUtils.getJwtFromCookies(any())).thenReturn(CURRENT_JWT);
        when(userSessionService.revokeOtherSessions(SESSION_USER, CURRENT_JWT)).thenReturn(3);

        mockMvc.perform(delete(BASE_URL + "/others").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Se han cerrado 3 sesiones en otros dispositivos."));
    }
}
