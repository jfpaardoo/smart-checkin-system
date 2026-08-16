package org.springframework.samples.smartcheckin.auth.webauthn;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.auth.webauthn.dto.*;
import org.springframework.samples.smartcheckin.exceptions.AccessDeniedException;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class WebAuthnServiceTests {

    private static final String TEST_USER = "testuser";
    private static final String CRED_ID = "cred-12345";
    private static final String NEW_CRED_999 = "new-cred-999";
    private static final String PUBLIC_KEY_TYPE = "public-key";
    private static final String VALID_CREATE_JSON = "{\"type\":\"webauthn.create\",\"challenge\":\"valid-challenge\"}";
    private static final String LOGIN_CHALLENGE = "login-chal";
    private static final String VALID_GET_JSON = "{\"type\":\"webauthn.get\",\"challenge\":\"login-chal\"}";

    @Mock
    private UserPasskeyRepository passkeyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WebAuthnChallengeService challengeService;

    @InjectMocks
    private WebAuthnService webAuthnService;

    private User testUser;
    private UserPasskey testPasskey;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(webAuthnService, "rpName", "Distribution Academy");
        ReflectionTestUtils.setField(webAuthnService, "rpId", "localhost");

        testUser = new User();
        testUser.setId(1);
        testUser.setUsername(TEST_USER);
        testUser.setFirstName("Juan");
        testUser.setLastName("Perez");
        testUser.setIsApproved(true);

        testPasskey = UserPasskey.builder()
                .user(testUser)
                .credentialId(CRED_ID)
                .publicKey("mock-public-key")
                .signCount(0L)
                .deviceType("Windows Hello")
                .nickname("Mi Portatil")
                .lastUsedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        testPasskey.setId(10);
    }

    @Test
    void testGenerateRegistrationOptionsWithExistingKeys() {
        when(challengeService.generateChallenge(1)).thenReturn("challenge-abc");
        when(passkeyRepository.findByUserId(1)).thenReturn(List.of(testPasskey));

        RegistrationOptionsResponse options = webAuthnService.generateRegistrationOptions(testUser);

        assertNotNull(options);
        assertEquals("challenge-abc", options.getChallenge());
        assertEquals("Distribution Academy", options.getRp().getName());
        assertNull(options.getRp().getId()); // localhost -> null
        assertEquals(TEST_USER, options.getUser().getName());
        assertEquals("Juan Perez", options.getUser().getDisplayName());
        assertEquals(1, options.getExcludeCredentials().size());
        assertEquals(CRED_ID, options.getExcludeCredentials().get(0).getId());
    }

    @Test
    void testGenerateRegistrationOptionsWithCustomDomainRpId() {
        ReflectionTestUtils.setField(webAuthnService, "rpId", "smartcheckin.com");
        when(challengeService.generateChallenge(1)).thenReturn("challenge-xyz");
        when(passkeyRepository.findByUserId(1)).thenReturn(Collections.emptyList());

        RegistrationOptionsResponse options = webAuthnService.generateRegistrationOptions(testUser);

        assertNotNull(options);
        assertEquals("smartcheckin.com", options.getRp().getId());
        assertTrue(options.getExcludeCredentials().isEmpty());
    }

    @Test
    void testVerifyAndSaveRegistrationSuccessWithCustomNickname() {
        String clientJsonBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(VALID_CREATE_JSON.getBytes(StandardCharsets.UTF_8));

        RegistrationVerifyRequest request = RegistrationVerifyRequest.builder()
                .id(NEW_CRED_999)
                .rawId(NEW_CRED_999)
                .type(PUBLIC_KEY_TYPE)
                .nickname("Mi iPhone 15")
                .deviceType("Apple Face ID")
                .response(RegistrationVerifyRequest.ResponseData.builder()
                        .clientDataJSON(clientJsonBase64)
                        .publicKey("base64-pub-key")
                        .build())
                .build();

        when(challengeService.validateAndConsumeChallenge("valid-challenge", 1)).thenReturn(true);
        when(passkeyRepository.save(any(UserPasskey.class))).thenAnswer(invocation -> {
            UserPasskey pk = invocation.getArgument(0);
            pk.setId(100);
            return pk;
        });

        PasskeyDTO result = webAuthnService.verifyAndSaveRegistration(testUser, request);

        assertNotNull(result);
        assertEquals(100, result.getId());
        assertEquals(NEW_CRED_999, result.getCredentialId());
        assertEquals("Mi iPhone 15", result.getNickname());
        assertEquals("Apple Face ID", result.getDeviceType());
        verify(passkeyRepository).save(any(UserPasskey.class));
    }

    @Test
    void testVerifyAndSaveRegistrationSuccessDefaultNicknameAndAttestationFallback() {
        String clientJsonBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(VALID_CREATE_JSON.getBytes(StandardCharsets.UTF_8));

        RegistrationVerifyRequest request = RegistrationVerifyRequest.builder()
                .id("new-cred-888")
                .rawId("new-cred-888")
                .type(PUBLIC_KEY_TYPE)
                .nickname(null)
                .deviceType(null)
                .response(RegistrationVerifyRequest.ResponseData.builder()
                        .clientDataJSON(clientJsonBase64)
                        .attestationObject("attestation-fallback-key")
                        .build())
                .build();

        when(challengeService.validateAndConsumeChallenge("valid-challenge", 1)).thenReturn(true);
        when(passkeyRepository.save(any(UserPasskey.class))).thenAnswer(invocation -> {
            UserPasskey pk = invocation.getArgument(0);
            pk.setId(101);
            return pk;
        });

        PasskeyDTO result = webAuthnService.verifyAndSaveRegistration(testUser, request);

        assertNotNull(result);
        assertEquals(101, result.getId());
        assertTrue(result.getNickname().contains("Llave de Acceso"));
    }

    @Test
    void testVerifyAndSaveRegistrationNullResponseThrowsException() {
        RegistrationVerifyRequest request = RegistrationVerifyRequest.builder()
                .id("cred")
                .response(null)
                .build();

        assertThrows(IllegalArgumentException.class, () -> webAuthnService.verifyAndSaveRegistration(testUser, request));
    }

    @Test
    void testVerifyAndSaveRegistrationInvalidTypeThrowsException() {
        String clientJson = "{\"type\":\"webauthn.get\",\"challenge\":\"valid-challenge\"}";
        String clientJsonBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(clientJson.getBytes(StandardCharsets.UTF_8));

        RegistrationVerifyRequest request = RegistrationVerifyRequest.builder()
                .id("cred")
                .response(RegistrationVerifyRequest.ResponseData.builder()
                        .clientDataJSON(clientJsonBase64)
                        .build())
                .build();

        assertThrows(IllegalArgumentException.class, () -> webAuthnService.verifyAndSaveRegistration(testUser, request));
    }

    @Test
    void testVerifyAndSaveRegistrationInvalidChallengeThrowsException() {
        String clientJson = "{\"type\":\"webauthn.create\",\"challenge\":\"invalid-challenge\"}";
        String clientJsonBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(clientJson.getBytes(StandardCharsets.UTF_8));

        RegistrationVerifyRequest request = RegistrationVerifyRequest.builder()
                .id("cred")
                .response(RegistrationVerifyRequest.ResponseData.builder()
                        .clientDataJSON(clientJsonBase64)
                        .build())
                .build();

        when(challengeService.validateAndConsumeChallenge("invalid-challenge", 1)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> webAuthnService.verifyAndSaveRegistration(testUser, request));
    }

    @Test
    void testGenerateLoginOptionsWithoutUsername() {
        when(challengeService.generateChallenge(null)).thenReturn("login-challenge-1");

        LoginOptionsResponse options = webAuthnService.generateLoginOptions(null);

        assertNotNull(options);
        assertEquals("login-challenge-1", options.getChallenge());
        assertTrue(options.getAllowCredentials().isEmpty());
    }

    @Test
    void testGenerateLoginOptionsWithExistingUsername() {
        when(userRepository.findByUsername(TEST_USER)).thenReturn(Optional.of(testUser));
        when(passkeyRepository.findByUserId(1)).thenReturn(List.of(testPasskey));
        when(challengeService.generateChallenge(1)).thenReturn("login-challenge-2");

        LoginOptionsResponse options = webAuthnService.generateLoginOptions(TEST_USER);

        assertNotNull(options);
        assertEquals("login-challenge-2", options.getChallenge());
        assertEquals(1, options.getAllowCredentials().size());
        assertEquals(CRED_ID, options.getAllowCredentials().get(0).getId());
    }

    @Test
    void testGenerateLoginOptionsWithNonExistingUsername() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(challengeService.generateChallenge(null)).thenReturn("login-challenge-3");

        LoginOptionsResponse options = webAuthnService.generateLoginOptions("unknown");

        assertNotNull(options);
        assertTrue(options.getAllowCredentials().isEmpty());
    }

    @Test
    void testVerifyLoginSuccess() {
        String clientJsonBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(VALID_GET_JSON.getBytes(StandardCharsets.UTF_8));

        LoginVerifyRequest request = LoginVerifyRequest.builder()
                .id(CRED_ID)
                .rawId(CRED_ID)
                .type(PUBLIC_KEY_TYPE)
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(clientJsonBase64)
                        .authenticatorData("authData")
                        .signature("sig")
                        .build())
                .build();

        when(challengeService.validateAndConsumeChallenge(LOGIN_CHALLENGE, null)).thenReturn(true);
        when(passkeyRepository.findByCredentialId(CRED_ID)).thenReturn(Optional.of(testPasskey));

        User loggedUser = webAuthnService.verifyLogin(request);

        assertNotNull(loggedUser);
        assertEquals(TEST_USER, loggedUser.getUsername());
        assertEquals(1L, testPasskey.getSignCount());
        verify(passkeyRepository).save(testPasskey);
    }

    @Test
    void testVerifyLoginUserNotApprovedThrowsException() {
        String clientJsonBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(VALID_GET_JSON.getBytes(StandardCharsets.UTF_8));

        LoginVerifyRequest request = LoginVerifyRequest.builder()
                .id(CRED_ID)
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(clientJsonBase64)
                        .build())
                .build();

        testUser.setIsApproved(false);
        when(challengeService.validateAndConsumeChallenge(LOGIN_CHALLENGE, null)).thenReturn(true);
        when(passkeyRepository.findByCredentialId(CRED_ID)).thenReturn(Optional.of(testPasskey));

        assertThrows(AccessDeniedException.class, () -> webAuthnService.verifyLogin(request));
    }

    @Test
    void testVerifyLoginCredentialNotFoundThrowsException() {
        String clientJsonBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(VALID_GET_JSON.getBytes(StandardCharsets.UTF_8));

        LoginVerifyRequest request = LoginVerifyRequest.builder()
                .id("cred-not-found")
                .response(LoginVerifyRequest.ResponseData.builder()
                        .clientDataJSON(clientJsonBase64)
                        .build())
                .build();

        when(challengeService.validateAndConsumeChallenge(LOGIN_CHALLENGE, null)).thenReturn(true);
        when(passkeyRepository.findByCredentialId("cred-not-found")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> webAuthnService.verifyLogin(request));
    }

    @Test
    void testVerifyLoginNullResponseThrowsException() {
        LoginVerifyRequest request = LoginVerifyRequest.builder()
                .id(CRED_ID)
                .response(null)
                .build();

        assertThrows(IllegalArgumentException.class, () -> webAuthnService.verifyLogin(request));
    }

    @Test
    void testListUserPasskeys() {
        when(passkeyRepository.findByUserId(1)).thenReturn(List.of(testPasskey));

        List<PasskeyDTO> list = webAuthnService.listUserPasskeys(1);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals(CRED_ID, list.get(0).getCredentialId());
    }

    @Test
    void testDeleteUserPasskeySuccess() {
        when(passkeyRepository.findByIdAndUserId(10, 1)).thenReturn(Optional.of(testPasskey));

        webAuthnService.deleteUserPasskey(10, 1);

        verify(passkeyRepository).delete(testPasskey);
    }

    @Test
    void testDeleteUserPasskeyNotFoundThrowsException() {
        when(passkeyRepository.findByIdAndUserId(99, 1)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> webAuthnService.deleteUserPasskey(99, 1));
    }
}
