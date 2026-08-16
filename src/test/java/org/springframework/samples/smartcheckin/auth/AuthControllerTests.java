package org.springframework.samples.smartcheckin.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.audit.AnomalyDetectionService;
import org.springframework.samples.smartcheckin.auth.payload.request.LoginRequest;
import org.springframework.samples.smartcheckin.auth.payload.request.SignupRequest;
import org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.samples.smartcheckin.notifications.EmailNotificationSender;
import org.springframework.samples.smartcheckin.notifications.PushNotificationSender;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.AuthoritiesService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Owner;

@Epic("Users & Admin Module")
@Feature("Authentication")
@Owner("DP1-tutors")
@SuppressWarnings("null")
@WebMvcTest(value = AuthController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = {
		SecurityAutoConfiguration.class })
class AuthControllerTests {

	private static final String BASE_URL = "/api/v1/auth";
	private static final String VERIFY_URL = "/verify-2fa";

	@MockitoBean
	private AuthenticationManager authenticationManager;

	@MockitoBean
	private JwtUtils jwtUtils;

	@MockitoBean
	private UserService userService;

	// Añadidos para satisfacer el constructor actualizado de AuthController
	@MockitoBean
	private AuthoritiesService authoritiesService;

	@MockitoBean
	private PasswordEncoder passwordEncoder;

	@MockitoBean
	private SimpMessagingTemplate simpMessagingTemplate;

	@MockitoBean
	private TotpService totpService;

	@MockitoBean
	private UserDetailsServiceImpl userDetailsService;

	@MockitoBean
	private AnomalyDetectionService anomalyDetectionService;

	@MockitoBean
	private JwtBlacklistService jwtBlacklistService;

	@MockitoBean
	private PasswordResetService passwordResetService;

	@MockitoBean
	private CaptchaService captchaService;

	@MockitoBean
	private JavaMailSender javaMailSender;

	@MockitoBean
	private EmailNotificationSender emailNotificationSender;

	@MockitoBean
	private PushNotificationSender pushNotificationSender;

	@Autowired
	@SuppressWarnings("java:S6813")
	private ObjectMapper objectMapper;

	@Autowired
	@SuppressWarnings("java:S6813")
	private MockMvc mockMvc;

	private static final String PASSWORD = "password";
	private static final String USER1 = "user1";
	private static final String SECRET = "SECRET";
	private static final String SIGNIN_URL = BASE_URL + "/signin";
	private static final String SIGNUP_URL = BASE_URL + "/signup";
	private static final String LOGOUT_URL = BASE_URL + "/logout";
	private static final String VALID_TOTP_CODE = "123456";
	private static final String MOCK_JWT_LITERAL = "MOCK_JWT";
	private static final String NEW_USER_2 = "newUser2";

	private LoginRequest loginRequest;
	private UserDetailsImpl userDetails;
	private String token;
	private ResponseCookie jwtCookie;

	@BeforeEach
	void setup() {
		loginRequest = new LoginRequest();
		loginRequest.setUsername("owner");
		loginRequest.setPassword(PASSWORD);
		loginRequest.setCaptchaToken("dummy-captcha-token");

		userDetails = new UserDetailsImpl(1, loginRequest.getUsername(), loginRequest.getPassword(),
				List.of(new SimpleGrantedAuthority("OWNER")));

		token = "JWT_TOKEN";
		jwtCookie = ResponseCookie.from("jwt", token).path("/api").maxAge(24 * 60 * 60).httpOnly(true).build();
		
		when(this.captchaService.validateCaptcha(any())).thenReturn(true);
	}

	@Test
    void shouldAuthenticateUser() throws Exception {
        Authentication auth = mock(Authentication.class);

        when(this.jwtUtils.generateJwtCookie(any(Authentication.class))).thenReturn(jwtCookie);
        when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        doReturn(userDetails).when(auth).getPrincipal();

        mockMvc.perform(post(SIGNIN_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))).andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(loginRequest.getUsername()))
                .andExpect(jsonPath("$.id").value(userDetails.getId()))
                .andExpect(cookie().exists("jwt"));
    }

	@Test
	void shouldNotAuthenticateUnapprovedUser() throws Exception {
		User unapprovedUser = new User();
		unapprovedUser.setIsApproved(false);
		when(userService.findUser(loginRequest.getUsername())).thenReturn(unapprovedUser);

		mockMvc.perform(post(SIGNIN_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isForbidden());
	}

	@Test
	void shouldNotAuthenticateLockedUser() throws Exception {
		User lockedUser = new User();
		lockedUser.setIsApproved(true);
		lockedUser.setAccountLockedUntil(LocalDateTime.now(ZoneId.systemDefault()).plusMinutes(10));
		when(userService.findUser(loginRequest.getUsername())).thenReturn(lockedUser);

		mockMvc.perform(post(SIGNIN_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isForbidden());
	}

	@Test
	void shouldChallengeTwoFactorAuthentication() throws Exception {
		User user2fa = new User();
		user2fa.setIsApproved(true);
		user2fa.setTwoFactorEnabled(true);
		user2fa.setUsername("owner");

		when(userService.findUser(loginRequest.getUsername())).thenReturn(user2fa);
		Authentication auth = mock(Authentication.class);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);

		mockMvc.perform(post(SIGNIN_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.requiresTwoFactor").value(true));
	}

	@Test
	void shouldHandleBadCredentials() throws Exception {
		User user = new User();
		user.setUsername(loginRequest.getUsername());
		when(userService.findUser(loginRequest.getUsername())).thenReturn(user);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
				.thenThrow(new BadCredentialsException("Bad Credentials"));

		mockMvc.perform(post(SIGNIN_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isBadRequest());
				
		verify(anomalyDetectionService).recordFailedLogin(eq(loginRequest.getUsername()), any(), eq(1));
	}

	@Test
	void shouldVerifyTwoFactorSuccess() throws Exception {
		TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
		req.setUsername(USER1);
		req.setCode(VALID_TOTP_CODE);

		User user = new User();
		user.setId(1);
		user.setUsername(USER1);
		user.setTwoFactorSecret(SECRET);

		when(userService.findUser(USER1)).thenReturn(user);
		when(totpService.validateCode(SECRET, VALID_TOTP_CODE)).thenReturn(true);
		when(userDetailsService.loadUserByUsername(USER1)).thenReturn(userDetails);
		when(jwtUtils.generateJwtCookie(any(Authentication.class))).thenReturn(ResponseCookie.from("jwt", MOCK_JWT_LITERAL).path("/api").maxAge(24 * 60 * 60).httpOnly(true).build());

		mockMvc.perform(post(BASE_URL + VERIFY_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("jwt"));
	}

	@Test
	void shouldVerifyTwoFactorInvalidCode() throws Exception {
		TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
		req.setUsername(USER1);
		req.setCode("000000");

		User user = new User();
		user.setUsername(USER1);
		user.setTwoFactorSecret(SECRET);

		when(userService.findUser(USER1)).thenReturn(user);
		when(totpService.validateCode(SECRET, "000000")).thenReturn(false);

		mockMvc.perform(post(BASE_URL + VERIFY_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void shouldRegisterUserSuccess() throws Exception {
		String newUser = "newuser";
		SignupRequest signup = new SignupRequest();
		signup.setUsername(newUser);
		signup.setPassword(PASSWORD);
		signup.setPersonalCode("9999");
		signup.setFirstName("New");
		signup.setLastName("User");
		signup.setEmail("newuser@example.com");
		signup.setCaptchaToken("dummy-captcha-token");

		when(userService.findUser(newUser)).thenThrow(new ResourceNotFoundException("User", "username", newUser));
		when(authoritiesService.findByAuthority("EMPLOYEE")).thenReturn(new Authorities());

		mockMvc.perform(post(SIGNUP_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(signup)))
				.andExpect(status().isOk());
	}

	@Test
	void shouldValidateToken() throws Exception {
		when(jwtUtils.validateJwtToken(MOCK_JWT_LITERAL)).thenReturn(true);
		when(jwtUtils.getJwtFromCookies(any())).thenReturn(MOCK_JWT_LITERAL);

		mockMvc.perform(get(BASE_URL + "/validate").header("Authorization", "Bearer " + MOCK_JWT_LITERAL))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").value(true));
	}

	@Test
	void shouldNotValidateToken() throws Exception {
		when(this.jwtUtils.validateJwtToken(token)).thenReturn(false);

		mockMvc.perform(get(BASE_URL + "/validate").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.param("token", token)).andExpect(status().isOk())
				.andExpect(jsonPath("$").value(false));
	}

	@Test
	@WithMockUser
	void shouldNotRegisterExistingUser() throws Exception {
		String existingUser = "existinguser";
		SignupRequest signup = new SignupRequest();
		signup.setUsername(existingUser);
		signup.setPassword(PASSWORD);
		signup.setPersonalCode("9999");
		signup.setFirstName("New");
		signup.setLastName("User");
		signup.setEmail("existinguser@example.com");
		signup.setCaptchaToken("dummy-captcha-token");

		User existing = new User();
		existing.setUsername(existingUser);

		when(userService.findUser(existingUser)).thenReturn(existing);

		mockMvc.perform(post(SIGNUP_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(signup)))
				.andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser
	void shouldLockUserAfterFiveFailedLogins() throws Exception {
		User user = new User();
		user.setUsername(loginRequest.getUsername());
		user.setFailedLoginAttempts(4);
		user.setIsApproved(true);

		when(userService.findUser(loginRequest.getUsername())).thenReturn(user);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
				.thenThrow(new BadCredentialsException("Bad Credentials"));

		mockMvc.perform(post(SIGNIN_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser
	void shouldUnlockExpiredLockout() throws Exception {
		User user = new User();
		user.setUsername(loginRequest.getUsername());
		user.setIsApproved(true);
		user.setAccountLockedUntil(LocalDateTime.now(ZoneId.systemDefault()).minusMinutes(1)); // Expired lockout

		when(userService.findUser(loginRequest.getUsername())).thenReturn(user);
		Authentication auth = mock(Authentication.class);
		when(this.jwtUtils.generateJwtCookie(any(Authentication.class))).thenReturn(jwtCookie);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
		doReturn(userDetails).when(auth).getPrincipal();

		mockMvc.perform(post(SIGNIN_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isOk());
	}

	@Test
    void testLogoutWithoutAuthorizationHeaderReturnsBadRequest() throws Exception {
        mockMvc.perform(post(LOGOUT_URL).with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: No JWT token found in request."));
    }

    @Test
    void testLogoutWithInvalidAuthorizationHeaderReturnsBadRequest() throws Exception {
        mockMvc.perform(post(LOGOUT_URL)
                .with(csrf())
                .header("Authorization", "InvalidToken123"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSigninSuccessfulLoginResetsFailedAttempts() throws Exception {
        User userWithFails = new User();
        userWithFails.setUsername(loginRequest.getUsername());
        userWithFails.setIsApproved(true);
        userWithFails.setFailedLoginAttempts(3); 
        
        when(userService.findUser(loginRequest.getUsername())).thenReturn(userWithFails);
        
        Authentication auth = mock(Authentication.class);
        when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        doReturn(userDetails).when(auth).getPrincipal();
        when(this.jwtUtils.generateJwtCookie(any(Authentication.class))).thenReturn(jwtCookie);

        mockMvc.perform(post(SIGNIN_URL).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());
                
        verify(userService, times(1)).saveUser(userWithFails);
        assertEquals(0, userWithFails.getFailedLoginAttempts());
    }

    @Test
    void testSignupEmployeeAuthorityNotFoundCreatesNewAuthority() throws Exception {
        SignupRequest signup = new SignupRequest();
        signup.setUsername(NEW_USER_2);
        signup.setPassword(PASSWORD);
        signup.setPersonalCode("9999");
        signup.setFirstName("New");
        signup.setLastName("User");
        signup.setEmail("newUser2@example.com");
        signup.setCaptchaToken("dummy-captcha-token");

        when(userService.findUser(NEW_USER_2)).thenThrow(new ResourceNotFoundException("User", "username", NEW_USER_2));
        when(authoritiesService.findByAuthority("EMPLOYEE")).thenThrow(new ResourceNotFoundException("Authority not found"));

        mockMvc.perform(post(SIGNUP_URL).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signup)))
                .andExpect(status().isOk());

        verify(authoritiesService, times(1)).saveAuthorities(any(Authorities.class));
    }

	@Test
	void shouldLogoutUserSuccessfully() throws Exception {
		when(jwtUtils.getJwtFromCookies(any())).thenReturn("MOCK_VALID_JWT_TOKEN");
		when(jwtUtils.getCleanJwtCookie()).thenReturn(ResponseCookie.from("jwt", "").path("/api").maxAge(0).build());
		
		mockMvc.perform(post(LOGOUT_URL).with(csrf())
				.header("Authorization", "Bearer MOCK_VALID_JWT_TOKEN"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Log out successful!"));

		verify(jwtBlacklistService, times(1)).blacklistToken("MOCK_VALID_JWT_TOKEN");
	}

    @Test
    void shouldVerifyTwoFactorUserNotFound() throws Exception {
        TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
        req.setUsername("nonexistent");
        req.setCode(VALID_TOTP_CODE);

        when(userService.findUser("nonexistent")).thenThrow(new ResourceNotFoundException("User not found"));

        mockMvc.perform(post(BASE_URL + VERIFY_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldVerifyTwoFactorSuccessResetsFailedAttempts() throws Exception {
        TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
        req.setUsername(USER1);
        req.setCode(VALID_TOTP_CODE);

        User user = new User();
        user.setId(1);
        user.setUsername(USER1);
        user.setTwoFactorSecret(SECRET);
        user.setFailedLoginAttempts(3); // Para cubrir la condición de restablecimiento de intentos

        when(userService.findUser(USER1)).thenReturn(user);
        when(totpService.validateCode(SECRET, VALID_TOTP_CODE)).thenReturn(true);
        when(userDetailsService.loadUserByUsername(USER1)).thenReturn(userDetails);
        when(jwtUtils.generateJwtCookie(any(Authentication.class))).thenReturn(ResponseCookie.from("jwt", MOCK_JWT_LITERAL).path("/api").maxAge(24 * 60 * 60).httpOnly(true).build());

        mockMvc.perform(post(BASE_URL + VERIFY_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("jwt"));

        verify(userService, times(1)).saveUser(user);
        assertEquals(0, user.getFailedLoginAttempts());
    }
}
