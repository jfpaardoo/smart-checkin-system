package org.springframework.samples.smartcheckin.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.auth.payload.request.LoginRequest;
import org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationCheckinFacade;
import org.springframework.samples.smartcheckin.formation.FormationService;
import org.springframework.samples.smartcheckin.notification.NotificationContext;
import org.springframework.samples.smartcheckin.notification.PushNotificationSender;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;

class SecurityRegressionTests {

    private AuthController authController;
    private JwtUtils jwtUtils;
    private TotpService totpService;
    private UserService userService;
    private CaptchaService captchaService;

    @BeforeEach
    void setUp() {
        jwtUtils = mock(JwtUtils.class);
        totpService = mock(TotpService.class);
        userService = mock(UserService.class);
        captchaService = mock(CaptchaService.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);

        authController = new AuthController(
                null,
                userService,
                null,
                jwtUtils,
                encoder,
                null,
                totpService,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                captchaService,
                null,
                null,
                null,
                null,
                null
        );
    }

    @Test
    void testVerifyTwoFactorMissingTokenReturnsUnauthorized() {
        TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
        req.setCode("123456");
        req.setMfaToken(null);

        ResponseEntity<Object> response = authController.verifyTwoFactor(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void testVerifyTwoFactorInvalidTokenReturnsUnauthorized() {
        TwoFactorVerifyRequest req = new TwoFactorVerifyRequest();
        req.setCode("123456");
        req.setMfaToken("invalid.jwt.token");

        when(jwtUtils.validateMfaChallengeToken("invalid.jwt.token")).thenReturn(false);

        ResponseEntity<Object> response = authController.verifyTwoFactor(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void testInvalidCaptchaTokenReturnsBadRequest() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("Secret123!");
        loginRequest.setCaptchaToken("invalid-captcha-token");

        when(captchaService.validateCaptcha("invalid-captcha-token")).thenReturn(false);

        ResponseEntity<Object> response = authController.authenticateUser(loginRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void testBuddyPunchingPreventedForNonAdminUser() {
        FormationService formationService = mock(FormationService.class);
        UserService fUserService = mock(UserService.class);
        CloudStorageAdapter storageAdapter = mock(CloudStorageAdapter.class);
        PushNotificationSender pushSender = mock(PushNotificationSender.class);
        NotificationContext notifContext = mock(NotificationContext.class);

        FormationCheckinFacade facade = new FormationCheckinFacade(
                formationService,
                fUserService,
                storageAdapter,
                pushSender,
                notifContext
        );

        User regularUser = new User();
        regularUser.setId(42);
        regularUser.setUsername("regular.employee");
        regularUser.setPersonalCode("1234");
        Authorities userAuth = new Authorities();
        userAuth.setAuthority("USER");
        regularUser.setAuthority(userAuth);

        when(fUserService.findCurrentUser()).thenReturn(regularUser);

        Formation formation = new Formation();
        formation.setId(10);
        when(formationService.registerAttendance(eq(10), eq("1234"), eq(true))).thenReturn(formation);

        // Attempting to pass someone else's personalCode "9999" - facade overrides with "1234"
        Formation result = facade.registerAttendance(10, "9999");

        assertThat(result).isNotNull();
    }

    @Test
    void testTotpAntiReplayRejectsReusedToken() {
        TotpService realTotp = new TotpService();
        String token = "789123";
        String username = "testuser";

        assertThat(realTotp.isTokenConsumedForUser(token, username)).isFalse();

        realTotp.markTokenConsumedForUser(token, username);

        assertThat(realTotp.isTokenConsumedForUser(token, username)).isTrue();
    }
}
