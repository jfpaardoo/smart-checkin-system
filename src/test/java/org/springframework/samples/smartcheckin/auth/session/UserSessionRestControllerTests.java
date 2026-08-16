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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SuppressWarnings("null")
@WebMvcTest(controllers = UserSessionRestController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class),
        excludeAutoConfiguration = { SecurityAutoConfiguration.class })
class UserSessionRestControllerTests {

    private static final String BASE_URL = "/api/v1/users/me/sessions";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserSessionService userSessionService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtUtils jwtUtils;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1);
        testUser.setUsername("sessionUser");
        when(userService.findCurrentUser()).thenReturn(testUser);
    }

    @Test
    @WithMockUser(username = "sessionUser")
    void testGetMyActiveSessions() throws Exception {
        UserSessionDTO dto = UserSessionDTO.builder()
                .id(10)
                .ipAddress("192.168.1.1")
                .deviceInfo("Chrome en Windows")
                .createdAt(LocalDateTime.now())
                .lastActivityAt(LocalDateTime.now())
                .isCurrent(true)
                .build();

        when(jwtUtils.getJwtFromCookies(any())).thenReturn("currentJwt");
        when(userSessionService.getActiveSessions("sessionUser", "currentJwt")).thenReturn(List.of(dto));

        mockMvc.perform(get(BASE_URL).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].deviceInfo").value("Chrome en Windows"))
                .andExpect(jsonPath("$[0].current").value(true));
    }

    @Test
    @WithMockUser(username = "sessionUser")
    void testRevokeSessionSuccess() throws Exception {
        when(userSessionService.revokeSession("sessionUser", 10)).thenReturn(true);

        mockMvc.perform(delete(BASE_URL + "/10").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Sesión cerrada correctamente."));
    }

    @Test
    @WithMockUser(username = "sessionUser")
    void testRevokeSessionNotFound() throws Exception {
        when(userSessionService.revokeSession("sessionUser", 99)).thenReturn(false);

        mockMvc.perform(delete(BASE_URL + "/99").with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "sessionUser")
    void testRevokeOtherSessions() throws Exception {
        when(jwtUtils.getJwtFromCookies(any())).thenReturn("currentJwt");
        when(userSessionService.revokeOtherSessions("sessionUser", "currentJwt")).thenReturn(3);

        mockMvc.perform(delete(BASE_URL + "/others").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Se han cerrado 3 sesiones en otros dispositivos."));
    }
}
