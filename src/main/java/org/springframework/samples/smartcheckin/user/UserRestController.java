package org.springframework.samples.smartcheckin.user;

import java.security.Principal;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.auth.payload.request.TwoFactorVerifyRequest;
import org.springframework.samples.smartcheckin.auth.payload.response.MessageResponse;
import org.springframework.samples.smartcheckin.exceptions.AccessDeniedException;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.samples.smartcheckin.util.RestPreconditions;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1/users")
@SecurityRequirement(name = "bearerAuth")
class UserRestController {

    private final UserService userService;
    private final AuthoritiesService authService;
    private final PasswordEncoder passwordEncoder;
    private final SimpMessagingTemplate messagingTemplate;
    private final TotpService totpService;
    private static final String TOPIC_UPDATE_USERS = "/topic/users";
    private static final String UPDATE = "update";
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final JavaMailSender javaMailSender;

    @Autowired
    public UserRestController(UserService userService, AuthoritiesService authService, 
            PasswordEncoder passwordEncoder, SimpMessagingTemplate messagingTemplate, TotpService totpService,
            JavaMailSender javaMailSender) {
        this.userService = userService;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
        this.messagingTemplate = messagingTemplate;
        this.totpService = totpService;
        this.javaMailSender = javaMailSender;
    }

    @GetMapping
    public ResponseEntity<List<User>> findAll(@RequestParam(required = false) String auth,
                                              @RequestParam(required = false) String search) {
        List<User> res;
        if (auth != null && !auth.isBlank()) {
            res = (List<User>) userService.findAllByAuthority(auth);
        } else {
            res = (List<User>) userService.findApprovedUsers();
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase().trim();
            res = res.stream().filter(u ->
                (u.getUsername() != null && u.getUsername().toLowerCase().contains(q)) ||
                (u.getFirstName() != null && u.getFirstName().toLowerCase().contains(q)) ||
                (u.getLastName() != null && u.getLastName().toLowerCase().contains(q)) ||
                (u.getPersonalCode() != null && u.getPersonalCode().toLowerCase().contains(q))
            ).toList();
        }

        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @GetMapping("authorities")
    public ResponseEntity<List<Authorities>> findAllAuths() {
        List<Authorities> res = (List<Authorities>) authService.findAll();
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile() {
        User user = userService.findCurrentUser();
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    public static class NotificationPreferencesRequest {
        private Boolean emailNotificationsEnabled;
        private Boolean pushNotificationsEnabled;
        public Boolean getEmailNotificationsEnabled() { return emailNotificationsEnabled; }
        public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) { this.emailNotificationsEnabled = emailNotificationsEnabled; }
        public Boolean getPushNotificationsEnabled() { return pushNotificationsEnabled; }
        public void setPushNotificationsEnabled(Boolean pushNotificationsEnabled) { this.pushNotificationsEnabled = pushNotificationsEnabled; }
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(@RequestBody NotificationPreferencesRequest userUpdates) {
        User currentUser = userService.findCurrentUser();
        
        // Only allow updating safe fields, like notification preferences
        if (userUpdates.getEmailNotificationsEnabled() != null) {
            currentUser.setEmailNotificationsEnabled(userUpdates.getEmailNotificationsEnabled());
        }
        if (userUpdates.getPushNotificationsEnabled() != null) {
            currentUser.setPushNotificationsEnabled(userUpdates.getPushNotificationsEnabled());
        }
        
        User updated = userService.saveUser(currentUser);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount() {
        User user = userService.findCurrentUser();
        
        // Ensure admins cannot delete themselves directly if it causes issues, but per GDPR, any user has the right to be forgotten.
        // We might want to restrict this if they are the ONLY admin, but for now we proceed.
        userService.deleteUser(user.getId());
        
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("me/formations")
    public ResponseEntity<List<FormationAttendance>> getMyFormations() {
        User currentUser = userService.findCurrentUser();
        return new ResponseEntity<>(currentUser.getFormationAttendances(), HttpStatus.OK);
    }

    @PutMapping("me/password")
    public ResponseEntity<MessageResponse> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        User currentUser = userService.findCurrentUser();
        if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("La contraseña actual no es correcta."));
        }
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            return ResponseEntity.badRequest().body(new MessageResponse("La nueva contraseña debe tener al menos 6 caracteres."));
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("La confirmación de la contraseña no coincide."));
        }
        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userService.saveUser(currentUser);
        return ResponseEntity.ok(new MessageResponse("Contraseña actualizada con éxito."));
    }

    @PostMapping("2fa/setup")
    public ResponseEntity<Map<String, String>> setupTwoFactor(@RequestParam(required = false, defaultValue = "APP") String type, Principal principal) {
        User user = userService.findUser(principal.getName());
        byte[] buffer = new byte[10];
        SECURE_RANDOM.nextBytes(buffer);
        String secret = new Base32().encodeAsString(buffer).replace("=", "");
        
        user.setTwoFactorSecret(secret);
        userService.saveUser(user);
        
        Map<String, String> response = new HashMap<>();
        response.put("secret", secret);
        
        if ("EMAIL".equalsIgnoreCase(type)) {
            String code = totpService.generateCode(secret);
            if (code != null) {
                try {
                    SimpleMailMessage mailMessage = new SimpleMailMessage();
                    mailMessage.setTo(user.getEmail());
                    mailMessage.setSubject("Código de Verificación 2FA");
                    mailMessage.setText("Tu código de configuración de 2 factores es: " + code);
                    javaMailSender.send(mailMessage);
                } catch (Exception e) {
                    // Ignore
                }
            }
        } else {
            String qrUri = String.format("otpauth://totp/SmartCheckin:%s?secret=%s&issuer=BAGlass", user.getUsername(), secret);
            response.put("qrUri", qrUri);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("2fa/enable")
    public ResponseEntity<MessageResponse> enableTwoFactor(@RequestBody @Valid TwoFactorVerifyRequest request, Principal principal) {
        User user = userService.findUser(principal.getName());
        if (user.getTwoFactorSecret() != null && totpService.validateCode(user.getTwoFactorSecret(), request.getCode())) {
            user.setTwoFactorEnabled(true);
            if (request.getType() != null && !request.getType().isBlank()) {
                user.setTwoFactorType(request.getType());
            } else {
                user.setTwoFactorType("APP"); // Default
            }
            userService.saveUser(user);
            return ResponseEntity.ok(new MessageResponse("2FA activado correctamente."));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Código de verificación incorrecto."));
    }

    @PostMapping("2fa/disable")
    public ResponseEntity<MessageResponse> disableTwoFactor(@RequestBody @Valid TwoFactorVerifyRequest request, Principal principal) {
        User user = userService.findUser(principal.getName());
        if (user.getTwoFactorSecret() != null && totpService.validateCode(user.getTwoFactorSecret(), request.getCode())) {
            user.setTwoFactorEnabled(false);
            user.setTwoFactorSecret(null);
            userService.saveUser(user);
            return ResponseEntity.ok(new MessageResponse("2FA desactivado correctamente."));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Código de verificación incorrecto."));
    }

    @GetMapping(value = "{id}")
    public ResponseEntity<User> findById(@PathVariable("id") Integer id) {
        return new ResponseEntity<>(userService.findUser(id), HttpStatus.OK);
    }

    @GetMapping("pending")
    public ResponseEntity<List<User>> findPendingUsers() {
        List<User> pending = (List<User>) userService.findPendingUsers();
        return new ResponseEntity<>(pending, HttpStatus.OK);
    }

    @PutMapping("{userId}/approve")
    public ResponseEntity<MessageResponse> approveUser(@PathVariable("userId") Integer id) {
        User target = userService.findUser(id);
        RestPreconditions.checkNotNull(target, "User", "ID", id);
        target.setIsApproved(true);
        userService.saveUser(target);
        messagingTemplate.convertAndSend(TOPIC_UPDATE_USERS, UPDATE);
        return ResponseEntity.ok(new MessageResponse("Usuario aprobado con éxito."));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SuppressWarnings("squid:S4684")
    public ResponseEntity<User> create(@RequestBody @Valid User user) {
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        user.setIsApproved(true);
        User savedUser = userService.saveUser(user);
        messagingTemplate.convertAndSend(TOPIC_UPDATE_USERS, UPDATE);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }

    @PutMapping(value = "{userId}")
    @ResponseStatus(HttpStatus.OK)
    @SuppressWarnings("squid:S4684")
    public ResponseEntity<User> update(@PathVariable("userId") Integer id, @RequestBody @Valid User user) {
        RestPreconditions.checkNotNull(userService.findUser(id), "User", "ID", id);
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        User updated = this.userService.updateUser(user, id);
        messagingTemplate.convertAndSend(TOPIC_UPDATE_USERS, UPDATE);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping(value = "{userId}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<MessageResponse> delete(@PathVariable("userId") int id) {
        RestPreconditions.checkNotNull(userService.findUser(id), "User", "ID", id);
        if (userService.findCurrentUser().getId() != id) {
            userService.deleteUser(id);
            messagingTemplate.convertAndSend(TOPIC_UPDATE_USERS, UPDATE);
            return new ResponseEntity<>(new MessageResponse("User deleted!"), HttpStatus.OK);
        } else
            throw new AccessDeniedException("You can't delete yourself!");
    }
}