package org.springframework.samples.smartcheckin.auth.webauthn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.samples.smartcheckin.auth.webauthn.dto.*;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("null")
@WebMvcTest(controllers = WebAuthnRestController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class),
        excludeAutoConfiguration = { SecurityAutoConfiguration.class })
class WebAuthnRestControllerTests {

    private static final String BASE_URL = "/api/v1/auth/webauthn";
    private static final String TEST_USER = "testuser";
    private static final String CRED_ID = "cred-123";
    private static final String PUBLIC_KEY_TYPE = "public-key";
    private static final String NICKNAME_IPHONE = "Mi iPhone";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WebAuthnService webAuthnService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private JwtUtils jwtUtils;

    @MockitoBean
    private org.springframework.samples.smartcheckin.audit.AnomalyDetectionService anomalyDetectionService;

    private User testUser;
    private UserDetailsImpl userDetails;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1);
        testUser.setUsername(TEST_USER);
        testUser.setIsApproved(true);

        Authorities auth = new Authorities();
        auth.setAuthority("USER");
        testUser.setAuthority(auth);

        userDetails = UserDetailsImpl.build(testUser);
    }

    @Test
    @WithMockUser(username = TEST_USER, authorities = { "USER" })
    void testGetRegisterOptions() throws Exception {
        RegistrationOptionsResponse options = RegistrationOptionsResponse.builder()
                .challenge("test-chal")
                .rp(RegistrationOptionsResponse.Rp.builder().name("Distribution Academy").build())
                .user(RegistrationOptionsResponse.UserDetails.builder().name(TEST_USER).build())
                .build();

        when(userService.findCurrentUser()).thenReturn(testUser);
        when(webAuthnService.generateRegistrationOptions(testUser)).thenReturn(options);

        mockMvc.perform(post(BASE_URL + "/register/options")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challenge").value("test-chal"))
                .andExpect(jsonPath("$.rp.name").value("Distribution Academy"));
    }

    @Test
    @WithMockUser(username = TEST_USER, authorities = { "USER" })
    void testVerifyRegisterSuccess() throws Exception {
        RegistrationVerifyRequest request = RegistrationVerifyRequest.builder()
                .id(CRED_ID)
                .rawId(CRED_ID)
                .type(PUBLIC_KEY_TYPE)
                .nickname(NICKNAME_IPHONE)
                .build();

        PasskeyDTO dto = PasskeyDTO.builder()
                .id(10)
                .credentialId(CRED_ID)
                .nickname(NICKNAME_IPHONE)
                .deviceType("Apple Face ID")
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        when(userService.findCurrentUser()).thenReturn(testUser);
        when(webAuthnService.verifyAndSaveRegistration(eq(testUser), any(RegistrationVerifyRequest.class))).thenReturn(dto);

        mockMvc.perform(post(BASE_URL + "/register/verify")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.credentialId").value(CRED_ID))
                .andExpect(jsonPath("$.nickname").value(NICKNAME_IPHONE));
    }

    @Test
    void testGetLoginOptions() throws Exception {
        LoginOptionsResponse response = LoginOptionsResponse.builder()
                .challenge("login-chal-123")
                .timeout(60000L)
                .build();

        when(webAuthnService.generateLoginOptions(TEST_USER)).thenReturn(response);

        mockMvc.perform(post(BASE_URL + "/login/options")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", TEST_USER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challenge").value("login-chal-123"));
    }

    @Test
    void testVerifyLoginSuccess() throws Exception {
        LoginVerifyRequest request = LoginVerifyRequest.builder()
                .id(CRED_ID)
                .rawId(CRED_ID)
                .type(PUBLIC_KEY_TYPE)
                .build();

        ResponseCookie cookie = ResponseCookie.from("smartcheckin-jwt", "mock-token").build();

        when(webAuthnService.verifyLogin(any(LoginVerifyRequest.class))).thenReturn(testUser);
        when(userDetailsService.loadUserByUsername(TEST_USER)).thenReturn(userDetails);
        when(jwtUtils.generateJwtCookie(any(Authentication.class))).thenReturn(cookie);

        mockMvc.perform(post(BASE_URL + "/login/verify")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(jsonPath("$.username").value(TEST_USER))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    @Test
    void testVerifyLoginFails() throws Exception {
        LoginVerifyRequest request = LoginVerifyRequest.builder()
                .id("cred-invalid")
                .rawId("cred-invalid")
                .type(PUBLIC_KEY_TYPE)
                .build();

        when(webAuthnService.verifyLogin(any(LoginVerifyRequest.class)))
                .thenThrow(new IllegalArgumentException("Challenge inválido"));

        mockMvc.perform(post(BASE_URL + "/login/verify")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error en inicio de sesión biométrico: Challenge inválido"));
    }

    @Test
    @WithMockUser(username = TEST_USER, authorities = { "USER" })
    void testGetMyPasskeys() throws Exception {
        PasskeyDTO dto = PasskeyDTO.builder()
                .id(1)
                .credentialId("cred-1")
                .nickname("MacBook")
                .build();

        when(userService.findCurrentUser()).thenReturn(testUser);
        when(webAuthnService.listUserPasskeys(1)).thenReturn(List.of(dto));

        mockMvc.perform(get(BASE_URL + "/credentials")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nickname").value("MacBook"));
    }

    @Test
    @WithMockUser(username = TEST_USER, authorities = { "USER" })
    void testDeletePasskeySuccess() throws Exception {
        when(userService.findCurrentUser()).thenReturn(testUser);
        doNothing().when(webAuthnService).deleteUserPasskey(1, 1);

        mockMvc.perform(delete(BASE_URL + "/credentials/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Llave de acceso eliminada correctamente."));
    }
}
