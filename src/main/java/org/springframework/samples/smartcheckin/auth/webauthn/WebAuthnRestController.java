package org.springframework.samples.smartcheckin.auth.webauthn;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;
import org.springframework.samples.smartcheckin.auth.payload.response.MessageResponse;
import org.springframework.samples.smartcheckin.auth.webauthn.dto.*;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth/webauthn")
@Tag(name = "WebAuthn / Passkeys", description = "Endpoints de autenticación biométrica y registro de llaves FIDO2 / Passkeys")
public class WebAuthnRestController {

    private final WebAuthnService webAuthnService;
    private final UserService userService;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtils jwtUtils;
    private final org.springframework.samples.smartcheckin.audit.AnomalyDetectionService anomalyDetectionService;
    private final jakarta.servlet.http.HttpServletRequest servletRequest;

    @Operation(summary = "Genera las opciones de desafío para registrar una nueva Passkey")
    @PostMapping("/register/options")
    public ResponseEntity<RegistrationOptionsResponse> getRegisterOptions() {
        User currentUser = userService.findCurrentUser();
        RegistrationOptionsResponse options = webAuthnService.generateRegistrationOptions(currentUser);
        return ResponseEntity.ok(options);
    }

    @Operation(summary = "Verifica y guarda la nueva Passkey vinculada a la cuenta")
    @PostMapping("/register/verify")
    public ResponseEntity<PasskeyDTO> verifyRegister(@Valid @RequestBody RegistrationVerifyRequest request) {
        User currentUser = userService.findCurrentUser();
        PasskeyDTO dto = webAuthnService.verifyAndSaveRegistration(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @Operation(summary = "Genera el desafío para inicio de sesión con Passkey")
    @PostMapping("/login/options")
    public ResponseEntity<LoginOptionsResponse> getLoginOptions(@RequestBody(required = false) Map<String, String> body) {
        String username = body != null ? body.get("username") : null;
        LoginOptionsResponse options = webAuthnService.generateLoginOptions(username);
        return ResponseEntity.ok(options);
    }

    @Operation(summary = "Verifica la aserción biométrica e inicia sesión emitiendo token JWT")
    @PostMapping("/login/verify")
    public ResponseEntity<Object> verifyLogin(@Valid @RequestBody LoginVerifyRequest request) {
        try {
            User user = webAuthnService.verifyLogin(request);

            UserDetailsImpl userDetails = (UserDetailsImpl) userDetailsService.loadUserByUsername(user.getUsername());
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

            String clientIp = servletRequest.getHeader("X-Forwarded-For") != null ? servletRequest.getHeader("X-Forwarded-For").split(",")[0].trim() : servletRequest.getRemoteAddr();
            anomalyDetectionService.recordSuccessfulLogin(user.getUsername(), clientIp, "Passkey / FIDO2");

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .body(new JwtResponse(null, user.getId().longValue(), user.getUsername(), roles));

        } catch (Exception e) {
            log.error("Error durante el inicio de sesión con Passkey", e);
            return ResponseEntity.badRequest().body(new MessageResponse("Error en inicio de sesión biométrico: " + e.getMessage()));
        }
    }

    @Operation(summary = "Lista todas las Passkeys registradas del usuario actual")
    @GetMapping("/credentials")
    public ResponseEntity<List<PasskeyDTO>> getMyPasskeys() {
        User currentUser = userService.findCurrentUser();
        List<PasskeyDTO> passkeys = webAuthnService.listUserPasskeys(currentUser.getId());
        return ResponseEntity.ok(passkeys);
    }

    @Operation(summary = "Elimina una Passkey registrada por el usuario")
    @DeleteMapping("/credentials/{id}")
    public ResponseEntity<MessageResponse> deletePasskey(@PathVariable("id") Integer id) {
        User currentUser = userService.findCurrentUser();
        webAuthnService.deleteUserPasskey(id, currentUser.getId());
        return ResponseEntity.ok(new MessageResponse("Llave de acceso eliminada correctamente."));
    }
}
