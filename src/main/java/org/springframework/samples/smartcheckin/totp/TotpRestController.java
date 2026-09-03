package org.springframework.samples.smartcheckin.totp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/totp")
@Tag(name = "TOTP", description = "The TOTP dynamic QR token API")
@SecurityRequirement(name = "bearerAuth")
@SuppressWarnings("null")
public class TotpRestController {

    private final TotpService totpService;
    private final FormationRepository formationRepository;

    @Autowired
    public TotpRestController(TotpService totpService, FormationRepository formationRepository) {
        this.totpService = totpService;
        this.formationRepository = formationRepository;
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, String>> getCurrentToken(
            @RequestParam(required = false) Object formationId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "false") boolean force) {

        if (formationId != null && !formationId.toString().trim().isEmpty()) {
            try {
                Integer parsedId = Integer.valueOf(formationId.toString().trim());
                Optional<Formation> formationOpt = formationRepository.findById(parsedId);
                if (formationOpt.isPresent()) {
                    Formation formation = formationOpt.get();
                    if (formation.isClosedSession()) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Esta formación ya ha finalizado y está cerrada. No se pueden generar códigos QR ni fichajes.");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                    }
                }
            } catch (NumberFormatException ignored) {
                // Si el ID no es numérico, procede con la generación estándar
            }
        }

        String token = force ? totpService.regenerateToken(formationId) : totpService.getCurrentToken(formationId);
        totpService.cacheAdminLocation(formationId, lat, lng);
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/regenerate")
    public ResponseEntity<Map<String, String>> regenerateToken(
            @RequestParam(required = false) Object formationId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        return getCurrentToken(formationId, lat, lng, true);
    }
}