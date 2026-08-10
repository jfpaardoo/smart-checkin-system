package org.springframework.samples.smartcheckin.auth;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.audit.AnomalyDetectionService;
import org.springframework.samples.smartcheckin.auth.payload.request.LoginRequest;
import org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
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
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "The Authentication API based on JWT")
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
    private final JavaMailSender javaMailSender;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, UserService userService, 
            AuthoritiesService authoritiesService, JwtUtils jwtUtils, PasswordEncoder passwordEncoder, 
            SimpMessagingTemplate messagingTemplate, TotpService totpService, UserDetailsServiceImpl userDetailsServiceImpl,
            AnomalyDetectionService anomalyDetectionService, HttpServletRequest request,
            JwtBlacklistService jwtBlacklistService, JavaMailSender javaMailSender) {
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
        this.javaMailSender = javaMailSender;
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logoutUser() {
        String headerAuth = request.getHeader("Authorization");
        if (org.springframework.util.StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7, headerAuth.length());
            jwtBlacklistService.blacklistToken(jwt);
            return ResponseEntity.ok(new MessageResponse("Log out successful!"));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Error: No JWT token found in request."));
    }

    @PostMapping("/signin")
    public ResponseEntity<Object> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        
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
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream().map(item -> item.getAuthority())
                .toList();

            if (user != null && user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                userService.saveUser(user);
            }

            return ResponseEntity.ok().body(new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), roles));
        }catch(BadCredentialsException exception){
            String ipAddress = request.getRemoteAddr();
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

        if (user.getTwoFactorSecret() == null || !totpService.validateCode(user.getTwoFactorSecret(), request.getCode())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Código 2FA inválido o expirado."));
        }

        // Cargar UserDetailsImpl correctamente para evitar el ClassCastException en JwtUtils
        UserDetailsImpl userDetails = (UserDetailsImpl) userDetailsServiceImpl.loadUserByUsername(user.getUsername());

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .toList();

        if (user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            userService.saveUser(user);
        }

        return ResponseEntity.ok().body(new JwtResponse(jwt, user.getId().longValue(), user.getUsername(), roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<Object> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            if (userService.findUser(signupRequest.getUsername()) != null) {
                return ResponseEntity.badRequest().body(new MessageResponse("El nombre de usuario ya se encuentra registrado."));
            }
        } catch (ResourceNotFoundException e) {
            // no hace nada
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
                    SimpleMailMessage mailMessage = new SimpleMailMessage();
                    mailMessage.setTo(user.getEmail());
                    mailMessage.setSubject("Código de Verificación 2FA");
                    mailMessage.setText("Tu código de verificación de 2 factores es: " + code);
                    javaMailSender.send(mailMessage);
                } catch (Exception e) {
                    // Si falla, el usuario no recibirá el correo
                }
            }
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateToken(@RequestParam String token) {
        Boolean isValid = jwtUtils.validateJwtToken(token);
        return ResponseEntity.ok(isValid);
    }

    @GetMapping("/public-key")
    public ResponseEntity<String> getPublicKey() {
        return ResponseEntity.ok(jwtUtils.getPublicKeyBase64());
    }
}