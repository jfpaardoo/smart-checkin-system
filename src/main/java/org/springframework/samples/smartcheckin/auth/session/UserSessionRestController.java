package org.springframework.samples.smartcheckin.auth.session;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.auth.payload.response.MessageResponse;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me/sessions")
@RequiredArgsConstructor
@Tag(name = "Sesiones de Usuario", description = "Gestión y revocación de sesiones activas concurrentes (OWASP ASVS L3)")
public class UserSessionRestController {

    private final UserSessionService userSessionService;
    private final UserService userService;
    private final JwtUtils jwtUtils;

    @Operation(summary = "Obtiene la lista de sesiones activas del usuario autenticado")
    @GetMapping
    public ResponseEntity<List<UserSessionDTO>> getMyActiveSessions(HttpServletRequest request) {
        User currentUser = userService.findCurrentUser();
        String currentJwt = jwtUtils.getJwtFromCookies(request);
        List<UserSessionDTO> sessions = userSessionService.getActiveSessions(currentUser.getUsername(), currentJwt);
        return ResponseEntity.ok(sessions);
    }

    @Operation(summary = "Revoca una sesión específica por ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> revokeSession(@PathVariable("id") Integer id) {
        User currentUser = userService.findCurrentUser();
        boolean revoked = userSessionService.revokeSession(currentUser.getUsername(), id);
        if (revoked) {
            return ResponseEntity.ok(new MessageResponse("Sesión cerrada correctamente."));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Cierra todas las demás sesiones excepto la actual")
    @DeleteMapping("/others")
    public ResponseEntity<MessageResponse> revokeOtherSessions(HttpServletRequest request) {
        User currentUser = userService.findCurrentUser();
        String currentJwt = jwtUtils.getJwtFromCookies(request);
        int revokedCount = userSessionService.revokeOtherSessions(currentUser.getUsername(), currentJwt);
        return ResponseEntity.ok(new MessageResponse(String.format("Se han cerrado %d sesiones en otros dispositivos.", revokedCount)));
    }
}
