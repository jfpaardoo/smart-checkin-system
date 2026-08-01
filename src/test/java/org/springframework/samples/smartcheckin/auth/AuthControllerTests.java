package org.springframework.samples.smartcheckin.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doReturn;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.samples.smartcheckin.auth.payload.request.LoginRequest;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.user.AuthoritiesService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

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

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private MockMvc mockMvc;

	private LoginRequest loginRequest;
	private UserDetailsImpl userDetails;
	private String token;

	@BeforeEach
	void setup() {
		loginRequest = new LoginRequest();
		loginRequest.setUsername("owner");
		loginRequest.setPassword("password");

		userDetails = new UserDetailsImpl(1, loginRequest.getUsername(), loginRequest.getPassword(),
				List.of(new SimpleGrantedAuthority("OWNER")));

		token = "JWT TOKEN";
	}

	@Test
	void shouldAuthenticateUser() throws Exception {
		Authentication auth = mock(Authentication.class);

		when(this.jwtUtils.generateJwtToken(any(Authentication.class))).thenReturn(token);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
		doReturn(userDetails).when(auth).getPrincipal();

		mockMvc.perform(post(BASE_URL + "/signin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest))).andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value(loginRequest.getUsername()))
				.andExpect(jsonPath("$.id").value(userDetails.getId())).andExpect(jsonPath("$.token").value(token));
	}

	@Test
	void shouldNotAuthenticateUnapprovedUser() throws Exception {
		org.springframework.samples.smartcheckin.user.User unapprovedUser = new org.springframework.samples.smartcheckin.user.User();
		unapprovedUser.setIsApproved(false);
		when(userService.findUser(loginRequest.getUsername())).thenReturn(unapprovedUser);

		mockMvc.perform(post(BASE_URL + "/signin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isForbidden());
	}

	@Test
	void shouldNotAuthenticateLockedUser() throws Exception {
		org.springframework.samples.smartcheckin.user.User lockedUser = new org.springframework.samples.smartcheckin.user.User();
		lockedUser.setIsApproved(true);
		lockedUser.setAccountLockedUntil(java.time.LocalDateTime.now().plusMinutes(10));
		when(userService.findUser(loginRequest.getUsername())).thenReturn(lockedUser);

		mockMvc.perform(post(BASE_URL + "/signin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isForbidden());
	}

	@Test
	void shouldChallengeTwoFactorAuthentication() throws Exception {
		org.springframework.samples.smartcheckin.user.User user2fa = new org.springframework.samples.smartcheckin.user.User();
		user2fa.setIsApproved(true);
		user2fa.setTwoFactorEnabled(true);
		user2fa.setUsername("owner");

		when(userService.findUser(loginRequest.getUsername())).thenReturn(user2fa);
		Authentication auth = mock(Authentication.class);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);

		mockMvc.perform(post(BASE_URL + "/signin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.requiresTwoFactor").value(true));
	}

	@Test
	void shouldHandleBadCredentials() throws Exception {
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
				.thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad Credentials"));

		mockMvc.perform(post(BASE_URL + "/signin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void shouldVerifyTwoFactorSuccess() throws Exception {
		org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest req = new org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest();
		req.setUsername("user1");
		req.setCode("123456");

		org.springframework.samples.smartcheckin.user.User user = new org.springframework.samples.smartcheckin.user.User();
		user.setId(1);
		user.setUsername("user1");
		user.setTwoFactorSecret("SECRET");

		when(userService.findUser("user1")).thenReturn(user);
		when(totpService.validateCode("SECRET", "123456")).thenReturn(true);
		when(userDetailsService.loadUserByUsername("user1")).thenReturn(userDetails);
		when(jwtUtils.generateJwtToken(any(Authentication.class))).thenReturn("MOCK_JWT");

		mockMvc.perform(post(BASE_URL + "/verify-2fa").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").value("MOCK_JWT"));
	}

	@Test
	void shouldVerifyTwoFactorInvalidCode() throws Exception {
		org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest req = new org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest();
		req.setUsername("user1");
		req.setCode("000000");

		org.springframework.samples.smartcheckin.user.User user = new org.springframework.samples.smartcheckin.user.User();
		user.setUsername("user1");
		user.setTwoFactorSecret("SECRET");

		when(userService.findUser("user1")).thenReturn(user);
		when(totpService.validateCode("SECRET", "000000")).thenReturn(false);

		mockMvc.perform(post(BASE_URL + "/verify-2fa").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void shouldRegisterUserSuccess() throws Exception {
		org.springframework.samples.smartcheckin.auth.payload.request.SignupRequest signup = new org.springframework.samples.smartcheckin.auth.payload.request.SignupRequest();
		signup.setUsername("newuser");
		signup.setPassword("password");
		signup.setPersonalCode("9999");
		signup.setFirstName("New");
		signup.setLastName("User");

		when(userService.findUser("newuser")).thenThrow(new org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException("User", "username", "newuser"));
		when(authoritiesService.findByAuthority("EMPLOYEE")).thenReturn(new org.springframework.samples.smartcheckin.user.Authorities());

		mockMvc.perform(post(BASE_URL + "/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(signup)))
				.andExpect(status().isOk());
	}

	@Test
	void shouldValidateToken() throws Exception {
		when(this.jwtUtils.validateJwtToken(token)).thenReturn(true);

		mockMvc.perform(get(BASE_URL + "/validate").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.param("token", token)).andExpect(status().isOk())
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
		org.springframework.samples.smartcheckin.auth.payload.request.SignupRequest signup = new org.springframework.samples.smartcheckin.auth.payload.request.SignupRequest();
		signup.setUsername("existinguser");
		signup.setPassword("password");
		signup.setPersonalCode("9999");
		signup.setFirstName("New");
		signup.setLastName("User");

		org.springframework.samples.smartcheckin.user.User existing = new org.springframework.samples.smartcheckin.user.User();
		existing.setUsername("existinguser");

		when(userService.findUser("existinguser")).thenReturn(existing);

		mockMvc.perform(post(BASE_URL + "/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(signup)))
				.andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser
	void shouldLockUserAfterFiveFailedLogins() throws Exception {
		org.springframework.samples.smartcheckin.user.User user = new org.springframework.samples.smartcheckin.user.User();
		user.setUsername(loginRequest.getUsername());
		user.setFailedLoginAttempts(4);
		user.setIsApproved(true);

		when(userService.findUser(loginRequest.getUsername())).thenReturn(user);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
				.thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad Credentials"));

		mockMvc.perform(post(BASE_URL + "/signin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser
	void shouldUnlockExpiredLockout() throws Exception {
		org.springframework.samples.smartcheckin.user.User user = new org.springframework.samples.smartcheckin.user.User();
		user.setUsername(loginRequest.getUsername());
		user.setIsApproved(true);
		user.setAccountLockedUntil(java.time.LocalDateTime.now().minusMinutes(1)); // Expired lockout

		when(userService.findUser(loginRequest.getUsername())).thenReturn(user);
		Authentication auth = mock(Authentication.class);
		when(this.jwtUtils.generateJwtToken(any(Authentication.class))).thenReturn(token);
		when(this.authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
		doReturn(userDetails).when(auth).getPrincipal();

		mockMvc.perform(post(BASE_URL + "/signin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isOk());
	}

	@Test
	void shouldGetPublicKey() throws Exception {
		when(jwtUtils.getPublicKeyBase64()).thenReturn("PUBLIC_KEY");

		mockMvc.perform(get(BASE_URL + "/public-key"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").value("PUBLIC_KEY"));
	}
}