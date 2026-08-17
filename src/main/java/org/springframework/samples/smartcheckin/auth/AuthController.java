package org.springframework.samples.smartcheckin.auth;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.audit.AnomalyDetectionService;
import org.springframework.samples.smartcheckin.audit.Auditable;
import org.springframework.samples.smartcheckin.auth.payload.request.LoginRequest;
import org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.samples.smartcheckin.company.Company;
import org.springframework.samples.smartcheckin.company.CompanyService;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.user.AuthoritiesService;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.authentication.BadCredentialsException;

import org.springframework.samples.smartcheckin.auth.payload.request.SignupRequest;
import org.springframework.samples.smartcheckin.auth.payload.response.MessageResponse;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.samples.smartcheckin.notifications.EmailNotificationSender;
import org.springframework.samples.smartcheckin.notifications.PushNotificationSender;
import org.springframework.samples.smartcheckin.notifications.TwoFactorNotification;
import org.springframework.samples.smartcheckin.notifications.AuthNotification;
import org.springframework.samples.smartcheckin.notifications.Notification;
import org.springframework.samples.smartcheckin.auth.payload.request.ForgotPasswordRequest;
import org.springframework.samples.smartcheckin.auth.payload.request.ResetPasswordRequest;
import org.springframework.samples.smartcheckin.auth.service.HaveIBeenPwnedService;
import org.springframework.samples.smartcheckin.auth.service.TwoFactorBackupCodeService;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "The Authentication API based on JWT")
@SuppressWarnings("null")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final AuthoritiesService authoritiesService;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final SimpMessagingTemplate messagingTemplate;
    private final TotpService totpService;
    private final UserDetailsServiceImpl userDetailsServiceImpl;
    private final AnomalyDetectionService anomalyDetectionService;
    private final HttpServletRequest request;
    private final org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService jwtBlacklistService;
    private final EmailNotificationSender emailNotificationSender;
    private final PushNotificationSender pushNotificationSender;
    private final PasswordResetService passwordResetService;
    private final JavaMailSender javaMailSender;
    private final CaptchaService captchaService;
    private final CompanyService companyService;
    private final HaveIBeenPwnedService haveIBeenPwnedService;
    private final TwoFactorBackupCodeService backupCodeService;
    private static final String CAPTCHA_SUCCESS_MESSAGE = "Error: Verificación de seguridad (Captcha) fallida.";
    private static final String HEADER = "X-Forwarded-For";

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.captcha.site-key:1x00000000000000000000AA}")
    private String captchaSiteKey;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, UserService userService, 
            AuthoritiesService authoritiesService, JwtUtils jwtUtils, PasswordEncoder passwordEncoder, 
            SimpMessagingTemplate messagingTemplate, TotpService totpService, UserDetailsServiceImpl userDetailsServiceImpl,
            AnomalyDetectionService anomalyDetectionService, HttpServletRequest request,
            JwtBlacklistService jwtBlacklistService, EmailNotificationSender emailNotificationSender, PushNotificationSender pushNotificationSender,
            PasswordResetService passwordResetService, JavaMailSender javaMailSender,
            CaptchaService captchaService, CompanyService companyService,
            HaveIBeenPwnedService haveIBeenPwnedService, TwoFactorBackupCodeService backupCodeService) {
        
        this.userService = userService;
        this.authoritiesService = authoritiesService;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.messagingTemplate = messagingTemplate;
        this.totpService = totpService;
        this.userDetailsServiceImpl = userDetailsServiceImpl;
        this.anomalyDetectionService = anomalyDetectionService;
        this.request = request;
        this.jwtBlacklistService = jwtBlacklistService;
        this.emailNotificationSender = emailNotificationSender;
        this.pushNotificationSender = pushNotificationSender;
        
        this.passwordResetService = passwordResetService;
        this.javaMailSender = javaMailSender;
        this.captchaService = captchaService;
        this.companyService = companyService;
        this.haveIBeenPwnedService = haveIBeenPwnedService;
        this.backupCodeService = backupCodeService;
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logoutUser(@RequestParam(required = false) String reason) {
        String jwt = jwtUtils.getJwtFromCookies(request);
        if (jwt != null) {
            String currentUsername = null;
            try {
                currentUsername = jwtUtils.getUserNameFromJwtToken(jwt);
            } catch (Exception e) {
                // Ignore if expired
            }
            String clientIp = request.getHeader(HEADER) != null ? request.getHeader(HEADER).split(",")[0].trim() : request.getRemoteAddr();
            jwtBlacklistService.blacklistToken(jwt);
            anomalyDetectionService.recordLogout(currentUsername != null ? currentUsername : "anonymous", clientIp, reason != null ? reason : "Manual");
            ResponseCookie cleanCookie = jwtUtils.getCleanJwtCookie();
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                    .body(new MessageResponse("Log out successful!"));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Error: No JWT token found in request."));
    }

    @PostMapping("/signin")
    public ResponseEntity<Object> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        
        // Validación del Captcha
        if (!captchaService.validateCaptcha(loginRequest.getCaptchaToken())) {
            return ResponseEntity.badRequest().body(new MessageResponse(CAPTCHA_SUCCESS_MESSAGE));
        }
        
        User user = null;
        try {
            user = userService.findUser(loginRequest.getUsername());
        } catch (ResourceNotFoundException e) {
            // no hace nada
        }

        if (user != null && Boolean.FALSE.equals(user.getIsApproved())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new MessageResponse("Tu cuenta está pendiente de aprobación por un administrador."));
        }

        ResponseEntity<Object> lockoutResponse = checkLockout(user);
        if (lockoutResponse != null) {
            return lockoutResponse;
        }

        try{
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            // Si las credenciales son correctas pero el usuario tiene activado 2FA, 
            // detenemos la emisión del JWT y exigimos el código del segundo factor.
            if (user != null && Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
                sendTwoFactorEmailIfConfigured(user);
                JwtResponse challengeResponse = new JwtResponse();
                challengeResponse.setRequiresTwoFactor(true);
                challengeResponse.setUsername(user.getUsername());
                return ResponseEntity.ok().body(challengeResponse);
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);
            ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream().map(item -> item.getAuthority())
                .toList();

            if (user != null && user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                userService.saveUser(user);
            }

            String clientIp = request.getHeader(HEADER) != null ? request.getHeader(HEADER).split(",")[0].trim() : request.getRemoteAddr();
            anomalyDetectionService.recordSuccessfulLogin(userDetails.getUsername(), clientIp, "Password");

            // Enviar notificación Push de éxito de inicio de sesión
            if (user != null) {
                Notification authNotif = new AuthNotification(pushNotificationSender, "IP: " + clientIp);
                authNotif.notify(user.getUsername());
            }

            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(new JwtResponse(null, userDetails.getId(), userDetails.getUsername(), roles));
        }catch(BadCredentialsException exception){
            String ipAddress = request.getHeader(HEADER) != null ? request.getHeader(HEADER).split(",")[0].trim() : request.getRemoteAddr();
            handleFailedLogin(user, loginRequest.getUsername(), ipAddress);
            return ResponseEntity.badRequest().body(new MessageResponse("Bad Credentials!"));
        }
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<Object> verifyTwoFactor(@Valid @RequestBody TwoFactorVerifyRequest request) {
        User user = null;
        try {
            user = userService.findUser(request.getUsername());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: User not found"));
        }

        boolean isTotpValid = user.getTwoFactorSecret() != null && totpService.validateCode(user.getTwoFactorSecret(), request.getCode());
        boolean isBackupCodeValid = false;
        if (!isTotpValid) {
            isBackupCodeValid = backupCodeService.verifyAndConsumeBackupCode(user, request.getCode());
        }

        if (!isTotpValid && !isBackupCodeValid) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Código 2FA inválido o expirado."));
        }

        // Cargar UserDetailsImpl correctamente para evitar el ClassCastException en JwtUtils
        UserDetailsImpl userDetails = (UserDetailsImpl) userDetailsServiceImpl.loadUserByUsername(user.getUsername());

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(authentication);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .toList();

        if (user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            userService.saveUser(user);
        }

        String clientIp = this.request.getHeader(HEADER) != null ? this.request.getHeader(HEADER).split(",")[0].trim() : this.request.getRemoteAddr();
        anomalyDetectionService.recordSuccessfulLogin(user.getUsername(), clientIp, isTotpValid ? "2FA TOTP" : "2FA Backup Code");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(new JwtResponse(null, user.getId().longValue(), user.getUsername(), roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<Object> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        // Validación del Captcha
        if (!captchaService.validateCaptcha(signupRequest.getCaptchaToken())) {
            return ResponseEntity.badRequest().body(new MessageResponse(CAPTCHA_SUCCESS_MESSAGE));
        }

        try {
            if (userService.findUser(signupRequest.getUsername()) != null) {
                return ResponseEntity.badRequest().body(new MessageResponse("El nombre de usuario ya se encuentra registrado."));
            }
        } catch (ResourceNotFoundException e) {
            // no hace nada
        }

        if (haveIBeenPwnedService.isPasswordPwned(signupRequest.getPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("La contraseña seleccionada ha aparecido en filtraciones de datos públicas conocidas (HaveIBeenPwned). Por favor, elige una contraseña más segura."));
        }

        User user = new User();
        user.setUsername(signupRequest.getUsername());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setPersonalCode(signupRequest.getPersonalCode());
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());
        user.setIsApproved(false);
        user.setIsWorking(false);

        Authorities authority;
        try {
            authority = authoritiesService.findByAuthority("EMPLOYEE");
        } catch (ResourceNotFoundException e) {
            authority = new Authorities();
            authority.setAuthority("EMPLOYEE");
            authoritiesService.saveAuthorities(authority);
        }

        user.setAuthority(authority);

        if (signupRequest.getCompanyId() != null) {
            try {
                Company company = companyService.findById(signupRequest.getCompanyId());
                user.setCompany(company);
            } catch (ResourceNotFoundException e) {
                // Ignore if company does not exist
            }
        }

        if (signupRequest.getLocator() != null && !signupRequest.getLocator().isBlank()) {
            user.setLocator(signupRequest.getLocator().toUpperCase().trim());
        }

        userService.saveUser(user);
        messagingTemplate.convertAndSend("/topic/users", "update");
        return ResponseEntity.ok(new MessageResponse("Solicitud de registro enviada con éxito. El administrador activará tu cuenta."));
    }

    private ResponseEntity<Object> checkLockout(User user) {
        if (user != null && user.getAccountLockedUntil() != null) {
            if (user.getAccountLockedUntil().isAfter(LocalDateTime.now(java.time.ZoneId.systemDefault()))) {
                return ResponseEntity.status(403).body(new MessageResponse("Account is locked due to too many failed attempts. Try again later."));
            } else {
                user.setAccountLockedUntil(null);
                user.setFailedLoginAttempts(0);
                userService.saveUser(user);
            }
        }
        return null;
    }

    private void handleFailedLogin(User user, String username, String ipAddress) {
        if (user != null) {
            int attempts = user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts();
            attempts++;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= 5) {
                user.setAccountLockedUntil(LocalDateTime.now(ZoneId.systemDefault()).plusMinutes(15));
            }
            userService.saveUser(user);
            
            anomalyDetectionService.recordFailedLogin(user.getUsername(), ipAddress, attempts);
        } else {
            // Unregistered user attempted login
            anomalyDetectionService.recordFailedLogin(username, ipAddress, 1);
        }
    }

    private void sendTwoFactorEmailIfConfigured(User user) {
        if ("EMAIL".equalsIgnoreCase(user.getTwoFactorType())) {
            String code = totpService.generateCode(user.getTwoFactorSecret());
            if (code != null) {
                try {
                    Notification twoFactorNotif = new TwoFactorNotification(emailNotificationSender, code);
                    twoFactorNotif.notify(user.getEmail());
                } catch (Exception e) {
                    // Si falla, el usuario no recibirá el correo
                }
            }
        }
    }

    @GetMapping("/captcha-config")
    public ResponseEntity<java.util.Map<String, String>> getCaptchaConfig() {
        return ResponseEntity.ok(java.util.Map.of("siteKey", captchaSiteKey));
    }

    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateToken(HttpServletRequest request) {
        String token = jwtUtils.getJwtFromCookies(request);
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }
        Boolean isValid = (token != null && jwtUtils.validateJwtToken(token));
        return ResponseEntity.ok(isValid);
    }

    @PostMapping("/forgot-password")
    @Auditable(action = "FORGOT_PASSWORD_REQUEST", details = "User requested password reset link")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // Validación del Captcha
        if (!captchaService.validateCaptcha(request.getCaptchaToken())) {
            return ResponseEntity.badRequest().body(new MessageResponse(CAPTCHA_SUCCESS_MESSAGE));
        }

        try {
            User user = userService.findUser(request.getEmail());
            
            // Verificamos que el usuario esté aprobado y no sea un usuario anonimizado por RGPD
            if (user != null && Boolean.TRUE.equals(user.getIsApproved()) && !user.getUsername().startsWith("GDPR_DEL_")) {
                String token = passwordResetService.createOrUpdatePasswordResetToken(user);
                
                // Limpiamos la barra final de la URL del frontend por si acaso viene con ella (ej: https://...com/)
                String baseUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
                
                // Enviar email con el enlace dinámico
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(user.getEmail());
                mailMessage.setSubject("Recuperación de Contraseña - Smart Checkin");
                mailMessage.setText("Hola " + user.getFirstName() + ",\n\n"
                        + "Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace (válido por 15 minutos):\n\n"
                        + baseUrl + "/reset-password?token=" + token + "\n\n"
                        + "Si no has sido tú, ignora este correo.");
                javaMailSender.send(mailMessage);
            }
        } catch (ResourceNotFoundException e) {
            // Se captura en silencio. Prevención de ataque de "Enumeración de Usuarios"
        }
        
        // Siempre devolvemos 200 OK para no darle pistas a los atacantes sobre qué emails existen en la BBDD
        return ResponseEntity.ok(new MessageResponse("Si el correo está registrado en el sistema, recibirás un enlace de recuperación."));
    }

    @PostMapping("/reset-password")
    @Auditable(action = "PASSWORD_RESET_SUCCESS", details = "User successfully reset their password via email token")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        
        PasswordResetToken resetToken = passwordResetService.validatePasswordResetToken(request.getToken());
        if (resetToken == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("El enlace es inválido o ha expirado."));
        }
        
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Las contraseñas no coinciden."));
        }

        if (haveIBeenPwnedService.isPasswordPwned(request.getNewPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("La nueva contraseña ha aparecido en filtraciones de datos públicas conocidas (HaveIBeenPwned). Por favor, elige una contraseña más segura."));
        }

        // Actualizamos la contraseña
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        
        // Desbloquear cuenta si estaba bloqueada
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userService.saveUser(user);
        
        // Consumimos y destruimos el token (One-Time Use)
        passwordResetService.deleteToken(resetToken);

        return ResponseEntity.ok(new MessageResponse("Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña."));
    }
}