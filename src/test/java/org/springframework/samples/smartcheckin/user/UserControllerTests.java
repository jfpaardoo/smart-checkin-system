package org.springframework.samples.smartcheckin.user;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest;
import org.springframework.samples.smartcheckin.auth.service.HaveIBeenPwnedService;
import org.springframework.samples.smartcheckin.auth.service.TwoFactorBackupCodeService;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.exceptions.AccessDeniedException;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Owner;

@Epic("Users & Admin Module")
@Feature("Users Management")
@Owner("DP1-tutors")
@SuppressWarnings("null")
@WebMvcTest(controllers = UserRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class UserControllerTests {

	private static final int TEST_USER_ID = 1;
	private static final int TEST_AUTH_ID = 1;
	private static final String BASE_URL = "/api/v1/users";
	private static final String ADMIN = "ADMIN";
	private static final String PASSWORD = "password";
	private static final String SIZE_PATH = "$.size()";
	private static final String ID_PATH = "/{id}";
	private static final String UPDATED = "UPDATED";
	private static final String USERNAME_PATH = "$.username";
	private static final String NAME_PATH = "PRUEBA";
	private static final String TWO_FACTOR_ENABLE_PATH = "/2fa/enable";
	private static final String TWO_FACTOR_DISABLE_PATH = "/2fa/disable";
	private static final String PASSWORD_PATH = "/me/password";
	private static final String ENCODED_OLD_PASS = "encodedOld";
	private static final String OLD_PASS = "oldPass123";
	private static final String NEW_PASS = "newPass123";
	private static final String TOTP_SECRET = "SECRET";
	private static final String TOTP_CODE = "123456";
	private static final String SEARCH_PARAM = "search";

	@MockitoBean
	private UserService userService;

	@MockitoBean
	private JavaMailSender javaMailSender;

	@MockitoBean
	private AuthoritiesService authService;

	@MockitoBean
	private PasswordEncoder passwordEncoder;

	@MockitoBean
	private SimpMessagingTemplate simpMessagingTemplate;

	@MockitoBean
	private TotpService totpService;

	@MockitoBean
	private HaveIBeenPwnedService haveIBeenPwnedService;

	@MockitoBean
	private TwoFactorBackupCodeService backupCodeService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private MockMvc mockMvc;

	private Authorities auth;
	private User user;
	private User logged;

	@BeforeEach
	void setup() {
		auth = new Authorities();
		auth.setId(TEST_AUTH_ID);
		auth.setAuthority(ADMIN);

		user = new User();
		user.setId(1);
		user.setUsername("user");
		user.setPassword(PASSWORD);
		user.setFirstName("TEST");
		user.setLastName("USER");
		user.setPersonalCode("1234");
		user.setEmail("user@example.com");
		user.setIsWorking(false);
		user.setAuthority(auth);

		if (SecurityContextHolder.getContext().getAuthentication() != null) {
			UserDetails details = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
			logged = new User();
			logged.setUsername(details.getUsername());
			logged.setPassword(details.getPassword());
			Authorities authorities = new Authorities();
			for (GrantedAuthority authority : details.getAuthorities()) {
				authorities.setAuthority(authority.getAuthority());
			}
			logged.setAuthority(authorities);
			doReturn(logged).when(this.userService).findCurrentUser();
		}
	}

	@Test
	@WithMockUser("admin")
	void shouldFindAllByAuthority() throws Exception {
		Authorities aux = new Authorities();
		aux.setId(2);
		aux.setAuthority("AUX");

		User mockUser = new User();
		mockUser.setId(1);
		mockUser.setUsername("user");
		mockUser.setPassword(PASSWORD);
		mockUser.setEmail("mock@example.com");
		mockUser.setAuthority(auth);
		mockUser.setPersonalCode("1000");

		User juan = new User();
		juan.setId(3);
		juan.setUsername("Juan");
		juan.setPassword(PASSWORD);
		juan.setEmail("juan@example.com");
		juan.setAuthority(auth);
		juan.setPersonalCode("1002");

		List<User> mockUsers = List.of(mockUser, juan);
		doReturn(mockUsers).when(userService).findAllByAuthority(auth.getAuthority());

		mockMvc.perform(get(BASE_URL).param("auth", ADMIN)).andExpect(status().isOk())
				.andExpect(jsonPath(SIZE_PATH).value(2))
				.andExpect(jsonPath("$[0].username").value("user"))
				.andExpect(jsonPath("$[1].username").value("Juan"));
	}

	@Test
	@WithMockUser("admin")
	void shouldFindAllAuths() throws Exception {
		Authorities aux = new Authorities();
		aux.setId(2);
		aux.setAuthority("AUX");

		List<Authorities> mockAuths = List.of(auth, aux);
		doReturn(mockAuths).when(authService).findAll();

		mockMvc.perform(get(BASE_URL + "/authorities")).andExpect(status().isOk())
				.andExpect(jsonPath(SIZE_PATH).value(2))
				.andExpect(jsonPath("$[0].authority").value(ADMIN))
				.andExpect(jsonPath("$[1].authority").value("AUX"));
	}

	@Test
	@WithMockUser("admin")
	void shouldReturnUser() throws Exception {
		doReturn(user).when(this.userService).findUser(TEST_USER_ID);
		
		mockMvc.perform(get(BASE_URL + ID_PATH, TEST_USER_ID)).andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(TEST_USER_ID))
				.andExpect(jsonPath(USERNAME_PATH).value(user.getUsername()))
				.andExpect(jsonPath("$.authority.authority").value(user.getAuthority().getAuthority()));
	}

	@Test
	@WithMockUser("admin")
	void shouldReturnNotFoundUser() throws Exception {
		doThrow(ResourceNotFoundException.class).when(this.userService).findUser(TEST_USER_ID);
		mockMvc.perform(get(BASE_URL + ID_PATH, TEST_USER_ID)).andExpect(status().isNotFound());
	}

	@Test
	@WithMockUser("admin")
	void shouldDeleteUser() throws Exception {
		User aux = new User();
		aux.setUsername(NAME_PATH);
		aux.setPassword(NAME_PATH);
		aux.setFirstName(NAME_PATH);
		aux.setLastName("TEST");
		aux.setEmail("aux@example.com");
		aux.setPersonalCode("5678");
		aux.setIsWorking(false);
		aux.setAuthority(auth);

		mockMvc.perform(post(BASE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(aux))).andExpect(status().isCreated());
	}

	@Test
	@WithMockUser("admin")
	void shouldUpdateUser() throws Exception {
		user.setUsername(UPDATED);
		user.setPassword("CHANGED");

		doReturn(user).when(this.userService).findUser(TEST_USER_ID);
		doReturn(user).when(this.userService).updateUser(any(User.class), any(Integer.class));

		mockMvc.perform(put(BASE_URL + ID_PATH, TEST_USER_ID).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(user))).andExpect(status().isOk())
				.andExpect(jsonPath(USERNAME_PATH).value(UPDATED));
	}

	@Test
	@WithMockUser("admin")
	void shouldReturnNotFoundUpdateUser() throws Exception {
		user.setUsername(UPDATED);
		user.setPassword(UPDATED);

		doThrow(ResourceNotFoundException.class).when(this.userService).findUser(TEST_USER_ID);
		doReturn(user).when(this.userService).updateUser(any(User.class), any(Integer.class));

		mockMvc.perform(put(BASE_URL + ID_PATH, TEST_USER_ID).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(user))).andExpect(status().isNotFound());
	}

	@Test
	@WithMockUser("admin")
	void shouldDeleteOtherUser() throws Exception {
		logged.setId(2);

		doReturn(user).when(this.userService).findUser(TEST_USER_ID);
		doNothing().when(this.userService).deleteUser(TEST_USER_ID);

		mockMvc.perform(delete(BASE_URL + ID_PATH, TEST_USER_ID).with(csrf())).andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("User deleted!"));
	}

	@Test
	@WithMockUser("admin")
	void shouldNotDeleteLoggedUser() throws Exception {
		logged.setId(TEST_USER_ID);

		doReturn(user).when(this.userService).findUser(TEST_USER_ID);
		doNothing().when(this.userService).deleteUser(TEST_USER_ID);

		mockMvc.perform(delete(BASE_URL + ID_PATH, TEST_USER_ID).with(csrf())).andExpect(status().isForbidden())
				.andExpect(result -> assertTrue(result.getResolvedException() instanceof AccessDeniedException));
	}

	@Test
	@WithMockUser("admin")
	void shouldGetMyProfile() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);

		mockMvc.perform(get(BASE_URL + "/me")).andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value(user.getUsername()));
	}

	@Test
	@WithMockUser("admin")
	void shouldGetMyFormations() throws Exception {
		user.setFormationAttendances(List.of());
		when(userService.findCurrentUser()).thenReturn(user);

		mockMvc.perform(get(BASE_URL + "/me/formations")).andExpect(status().isOk())
				.andExpect(jsonPath(SIZE_PATH).value(0));
	}

	@Test
	@WithMockUser("admin")
	void shouldChangePasswordSuccess() throws Exception {
		user.setPassword(ENCODED_OLD_PASS);
		when(userService.findCurrentUser()).thenReturn(user);
		when(passwordEncoder.matches(OLD_PASS, ENCODED_OLD_PASS)).thenReturn(true);

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword(OLD_PASS);
		req.setNewPassword(NEW_PASS);
		req.setConfirmPassword(NEW_PASS);

		mockMvc.perform(put(BASE_URL + PASSWORD_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser("admin")
	void shouldSetupTwoFactor() throws Exception {
		when(userService.findUser(anyString())).thenReturn(user);

		mockMvc.perform(post(BASE_URL + "/2fa/setup").with(csrf())).andExpect(status().isOk())
				.andExpect(jsonPath("$.secret").exists())
				.andExpect(jsonPath("$.qrUri").exists());
	}

	@Test
	@WithMockUser("admin")
	void shouldEnableTwoFactorSuccess() throws Exception {
		user.setTwoFactorSecret(TOTP_SECRET);
		when(userService.findUser(anyString())).thenReturn(user);
		when(totpService.validateCode(TOTP_SECRET, TOTP_CODE)).thenReturn(true);

		TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
		req.setCode(TOTP_CODE);

		mockMvc.perform(post(BASE_URL + TWO_FACTOR_ENABLE_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser("admin")
	void shouldDisableTwoFactor() throws Exception {
		user.setTwoFactorSecret(TOTP_SECRET);
		when(userService.findUser(anyString())).thenReturn(user);
		when(totpService.validateCode(TOTP_SECRET, TOTP_CODE)).thenReturn(true);

		TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
		req.setCode(TOTP_CODE);

		mockMvc.perform(post(BASE_URL + TWO_FACTOR_DISABLE_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser("admin")
	void shouldFindPendingUsers() throws Exception {
		when(userService.findPendingUsers()).thenReturn(List.of(user));

		mockMvc.perform(get(BASE_URL + "/pending")).andExpect(status().isOk())
				.andExpect(jsonPath(SIZE_PATH).value(1));
	}

	@Test
	@WithMockUser("admin")
	void shouldFindAllWithSearchAndRole() throws Exception {
		User searchUser = new User();
		searchUser.setId(5);
		searchUser.setUsername("specialSearch");
		searchUser.setFirstName("John");
		searchUser.setLastName("Doe");
		searchUser.setEmail("search@example.com");
		searchUser.setPersonalCode("9999");
		searchUser.setAuthority(auth);

		when(userService.findApprovedUsers()).thenReturn(List.of(user, searchUser));

		mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "special")).andExpect(status().isOk())
				.andExpect(jsonPath(SIZE_PATH).value(1))
				.andExpect(jsonPath("$[0].username").value("specialSearch"));
	}

	@Test
	@WithMockUser("admin")
	void shouldFailChangePasswordWrongCurrentPassword() throws Exception {
		user.setPassword(ENCODED_OLD_PASS);
		when(userService.findCurrentUser()).thenReturn(user);
		when(passwordEncoder.matches("wrongPass", ENCODED_OLD_PASS)).thenReturn(false);

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword("wrongPass");
		req.setNewPassword(NEW_PASS);
		req.setConfirmPassword(NEW_PASS);

		mockMvc.perform(put(BASE_URL + PASSWORD_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser("admin")
	void shouldFailChangePasswordShortNewPassword() throws Exception {
		user.setPassword(ENCODED_OLD_PASS);
		when(userService.findCurrentUser()).thenReturn(user);
		when(passwordEncoder.matches(OLD_PASS, ENCODED_OLD_PASS)).thenReturn(true);

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword(OLD_PASS);
		req.setNewPassword("123");
		req.setConfirmPassword("123");

		mockMvc.perform(put(BASE_URL + PASSWORD_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser("admin")
	void shouldFailChangePasswordMismatchConfirm() throws Exception {
		user.setPassword(ENCODED_OLD_PASS);
		when(userService.findCurrentUser()).thenReturn(user);
		when(passwordEncoder.matches(OLD_PASS, ENCODED_OLD_PASS)).thenReturn(true);

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword(OLD_PASS);
		req.setNewPassword(NEW_PASS);
		req.setConfirmPassword("different123");

		mockMvc.perform(put(BASE_URL + PASSWORD_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser("admin")
	void shouldFailEnableTwoFactor() throws Exception {
		user.setTwoFactorSecret(TOTP_SECRET);
		when(userService.findUser(anyString())).thenReturn(user);
		when(totpService.validateCode(TOTP_SECRET, TOTP_CODE)).thenReturn(false); // Wrong code

		TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
		req.setCode(TOTP_CODE);

		mockMvc.perform(post(BASE_URL + TWO_FACTOR_ENABLE_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser("admin")
	void shouldCreateUserNullPassword() throws Exception {
		User aux = new User();
		aux.setUsername("PruebaNullPass");
		// No password set
		aux.setFirstName("PRUEBA");
		aux.setLastName("TEST");
		aux.setEmail("aux2@example.com");
		aux.setPersonalCode("5678");
		aux.setIsWorking(false);
		aux.setAuthority(auth);
		
		when(userService.saveUser(any(User.class))).thenReturn(aux);

		mockMvc.perform(post(BASE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(aux))).andExpect(status().isCreated());
	}

	@Test
	@WithMockUser("admin")
	void shouldUpdateUserNullPassword() throws Exception {
		User aux = new User();
		aux.setUsername(UPDATED);
		aux.setPassword(null);
		aux.setFirstName("PRUEBA");
		aux.setLastName("TEST");
		aux.setEmail("aux3@example.com");
		aux.setPersonalCode("5678");
		aux.setIsWorking(false);
		aux.setAuthority(auth);

		doReturn(user).when(this.userService).findUser(TEST_USER_ID);
		doReturn(user).when(this.userService).updateUser(any(User.class), any(Integer.class));

		mockMvc.perform(put(BASE_URL + ID_PATH, TEST_USER_ID).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(aux))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser("admin")
	void shouldFindAllWithoutSearch() throws Exception {
		when(userService.findApprovedUsers()).thenReturn(List.of(user));

		mockMvc.perform(get(BASE_URL)).andExpect(status().isOk())
				.andExpect(jsonPath(SIZE_PATH).value(1));
	}

	@Test
	@WithMockUser("admin")
	void shouldUpdateUserEmptyPassword() throws Exception {
		User aux = new User();
		aux.setUsername(UPDATED);
		aux.setPassword("");
		aux.setFirstName("PRUEBA");
		aux.setLastName("TEST");
		aux.setEmail("aux@example.com");
		aux.setPersonalCode("5678");
		aux.setIsWorking(false);
		aux.setAuthority(auth);

		doReturn(user).when(this.userService).findUser(TEST_USER_ID);
		doReturn(user).when(this.userService).updateUser(any(User.class), any(Integer.class));

		mockMvc.perform(put(BASE_URL + ID_PATH, TEST_USER_ID).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(aux))).andExpect(status().isOk());
	}

	@Test
	@WithMockUser("admin")
	void shouldFindAllWithSearchFirstName() throws Exception {
		User searchUser = new User();
		searchUser.setId(5);
		searchUser.setUsername("other");
		searchUser.setFirstName("SpecialName");
		searchUser.setLastName("Doe");
		searchUser.setEmail("search2@example.com");
		searchUser.setPersonalCode("9999");
		searchUser.setAuthority(auth);

		when(userService.findApprovedUsers()).thenReturn(List.of(user, searchUser));

		mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "specialname")).andExpect(status().isOk())
				.andExpect(jsonPath(SIZE_PATH).value(1))
				.andExpect(jsonPath("$[0].firstName").value("SpecialName"));
	}

	@Test
	@WithMockUser("admin")
	void shouldFailChangePasswordNullCurrentPassword() throws Exception {
		when(userService.findCurrentUser()).thenReturn(user);

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword(null);
		req.setNewPassword(NEW_PASS);
		req.setConfirmPassword(NEW_PASS);

		mockMvc.perform(put(BASE_URL + PASSWORD_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser("admin")
	void shouldFailChangePasswordNullNewPassword() throws Exception {
		user.setPassword(ENCODED_OLD_PASS);
		when(userService.findCurrentUser()).thenReturn(user);
		when(passwordEncoder.matches(OLD_PASS, ENCODED_OLD_PASS)).thenReturn(true);

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword(OLD_PASS);
		req.setNewPassword(null);
		req.setConfirmPassword(null);

		mockMvc.perform(put(BASE_URL + PASSWORD_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser("admin")
	void shouldFailEnableTwoFactorNullSecret() throws Exception {
		user.setTwoFactorSecret(null);
		when(userService.findUser(anyString())).thenReturn(user);

		TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
		req.setCode("123456");

		mockMvc.perform(post(BASE_URL + "/2fa/enable").with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser("admin")
	void shouldApproveUser() throws Exception {
		when(userService.findUser(TEST_USER_ID)).thenReturn(user);

		mockMvc.perform(put(BASE_URL + "/{userId}/approve", TEST_USER_ID).with(csrf())).andExpect(status().isOk());
	}

	@Test
    @WithMockUser("admin")
    void shouldFindAllWithSearchLastName() throws Exception {
        User searchUser = new User();
        searchUser.setId(6);
        searchUser.setUsername("dummy");
        searchUser.setFirstName("John");
        searchUser.setLastName("UniqueLastName");
        searchUser.setEmail("unique@example.com");
        searchUser.setPersonalCode("9999");
        searchUser.setAuthority(auth);

        when(userService.findApprovedUsers()).thenReturn(List.of(user, searchUser));

        mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "uniquelastname")).andExpect(status().isOk())
                .andExpect(jsonPath(SIZE_PATH).value(1))
                .andExpect(jsonPath("$[0].lastName").value("UniqueLastName"));
    }

    @Test
    @WithMockUser("admin")
    void shouldFindAllWithSearchPersonalCode() throws Exception {
        User searchUser = new User();
        searchUser.setId(7);
        searchUser.setUsername("dummy");
        searchUser.setFirstName("John");
        searchUser.setLastName("Doe");
        searchUser.setEmail("doe@example.com");
        searchUser.setPersonalCode("5555");
        searchUser.setAuthority(auth);

        when(userService.findApprovedUsers()).thenReturn(List.of(user, searchUser));

        mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "5555")).andExpect(status().isOk())
                .andExpect(jsonPath(SIZE_PATH).value(1))
                .andExpect(jsonPath("$[0].personalCode").value("5555"));
    }

    @Test
    @WithMockUser("admin")
    void shouldFindAllWithSearchBlank() throws Exception {
        when(userService.findApprovedUsers()).thenReturn(List.of(user));

        mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "   ")).andExpect(status().isOk())
                .andExpect(jsonPath(SIZE_PATH).value(1));
    }

    @Test
    @WithMockUser("admin")
    void shouldFindAllWithAuthBlank() throws Exception {
        when(userService.findApprovedUsers()).thenReturn(List.of(user));

        mockMvc.perform(get(BASE_URL).param("auth", "   ")).andExpect(status().isOk())
                .andExpect(jsonPath(SIZE_PATH).value(1));
    }

    @Test
    @WithMockUser("admin")
    void shouldFailDisableTwoFactorNullSecret() throws Exception {
        user.setTwoFactorSecret(null);
        when(userService.findUser(anyString())).thenReturn(user);

        TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
        req.setCode("123456");

        mockMvc.perform(post(BASE_URL + "/2fa/disable").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser("admin")
    void shouldCreateUserWithNullPassword() throws Exception {
        User aux = new User();
        aux.setUsername("PruebaNullPass2");
        aux.setPassword(null);
        aux.setFirstName("PRUEBA");
        aux.setLastName("TEST");
        aux.setEmail("prueba2@example.com");
        aux.setPersonalCode("5678");
        aux.setIsWorking(false);
        aux.setAuthority(auth);
        
        when(userService.saveUser(any(User.class))).thenReturn(aux);

        mockMvc.perform(post(BASE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(aux))).andExpect(status().isCreated());
    }

	@Test
    @WithMockUser("admin")
    void shouldFailDisableTwoFactorWrongCode() throws Exception {
		user.setTwoFactorSecret(TOTP_SECRET);
		when(userService.findUser(anyString())).thenReturn(user);
		when(totpService.validateCode(TOTP_SECRET, "000000")).thenReturn(false);

		TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
		req.setCode("000000");

		mockMvc.perform(post(BASE_URL + TWO_FACTOR_DISABLE_PATH).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andExpect(status().isBadRequest());
    }

	@Test
    @WithMockUser(authorities = {"ADMIN"})
    void shouldFindAllWithAuthSpecificCaseSensitive() throws Exception {
        User testUser = new User();
        testUser.setId(1);
        testUser.setFirstName("TestName");
        testUser.setLastName("TestLastName");
        testUser.setUsername("testuser");
        testUser.setEmail("testuser@example.com");
        testUser.setPersonalCode("1234");
        Authorities testAuth = new Authorities();
        testAuth.setAuthority("USER");
        testUser.setAuthority(testAuth);

        when(userService.findApprovedUsers()).thenReturn(List.of(testUser));

        mockMvc.perform(get(BASE_URL).param(SEARCH_PARAM, "TestName"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(SIZE_PATH).value(1));
    }
}
