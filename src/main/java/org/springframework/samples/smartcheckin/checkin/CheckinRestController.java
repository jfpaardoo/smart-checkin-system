package org.springframework.samples.smartcheckin.checkin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.storage.LocalFileSystemService;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.formation.FormationService;
import org.springframework.samples.smartcheckin.formation.Formation;

@RestController
@RequestMapping("/api/v1/checkins")
@SecurityRequirement(name = "bearerAuth")
public class CheckinRestController {

    private final CheckinService checkInService;
    private final UserService userService;
    private final TotpService totpService;
    private final FormationService formationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final LocalFileSystemService localFileSystemService;
    private static final String MESSAGE_KEY = "message";

    @Autowired
    public CheckinRestController(CheckinService checkInService, UserService userService, TotpService totpService, FormationService formationService, SimpMessagingTemplate messagingTemplate, LocalFileSystemService localFileSystemService) {
        this.checkInService = checkInService;
        this.userService = userService;
        this.totpService = totpService;
        this.formationService = formationService;
        this.messagingTemplate = messagingTemplate;
        this.localFileSystemService = localFileSystemService;
    }

    @GetMapping("/my-history")
    public ResponseEntity<List<Checkin>> getMyHistory() {
        User currentUser = userService.findCurrentUser();
        List<Checkin> checkIns = checkInService.findByUserId(currentUser.getId());
        return new ResponseEntity<>(checkIns, HttpStatus.OK);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Checkin> checkIn(@RequestBody @Valid CheckinRequest request) {
        User currentUser = userService.findCurrentUser();
        Checkin saved = checkInService.performCheckIn(currentUser, request.getCheckInType());
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping("/qr-fichaje")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Object> qrCheckin(@RequestBody @Valid QrCheckinRequest request) {
        User user = userService.findCurrentUser();
        Formation targetFormation = resolveFormation(request);

        // ==========================================
        // FLUJO 1: EL CÓDIGO ES DE UNA FORMACIÓN
        // ==========================================
        if (targetFormation != null) {
            try {
                // Lo registramos en la formación
                formationService.registerAttendance(targetFormation.getId(), user);
                messagingTemplate.convertAndSend("/topic/formations", "UPDATED");
                
                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("formationId", targetFormation.getId());
                responseBody.put("formationName", targetFormation.getName());
                
                // Simulamos la info de Entrada para que el Frontend la lea bien
                Map<String, String> checkinInfo = new HashMap<>();
                checkinInfo.put("type", "ENTRADA");
                responseBody.put("checkin", checkinInfo);
                
                return new ResponseEntity<>(responseBody, HttpStatus.CREATED);
                
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(MESSAGE_KEY, "Error al registrar en formación: " + e.getMessage()));
            }
        }

        // ==========================================
        // FLUJO 2: EL CÓDIGO NO ES DE FORMACIÓN (Fichaje Global de la fábrica)
        // ==========================================
        if (!totpService.verifyToken(request.getToken())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(MESSAGE_KEY, "Código inválido o expirado."));
        }

        // Si es el global, verificamos distancia si fuera necesario
        if (isLocationInvalid(request)) {
            double distance = calculateDistance(request.getUserLat(), request.getUserLng(), 
                                                request.getAdminLat(), request.getAdminLng());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(MESSAGE_KEY, "Demasiado lejos del punto de control. Distancia: " + Math.round(distance) + "m (Max: 50m)"));
        }

        // Calculamos si entra o sale
        CheckinType type = (Boolean.TRUE.equals(user.getIsWorking())) ? CheckinType.SALIDA : CheckinType.ENTRADA;
        
        // Exigimos firma si sale
        if (type == CheckinType.SALIDA && isSignatureMissing(request)) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of("needsSignature", true, MESSAGE_KEY, "Signature required for checkout"));
        }

        Checkin saved = processCheckinRecord(user, type, request.getSignature());

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("checkin", saved);

        return new ResponseEntity<>(responseBody, HttpStatus.CREATED);
    }

    private Formation resolveFormation(QrCheckinRequest request) {
        List<Formation> allFormations = formationService.findAll();

        if (request.getFormationId() != null) {
            Object reqId = request.getFormationId();
            if (totpService.verifyToken(request.getToken(), reqId)) {
                return allFormations.stream()
                        .filter(f -> String.valueOf(f.getId()).equals(String.valueOf(reqId)))
                        .findFirst()
                        .orElse(null);
            }
            return null;
        }

        for (Formation f : allFormations) {
            if (totpService.verifyToken(request.getToken(), f.getId())) {
                return f;
            }
        }
        return null;
    }

    private boolean isLocationInvalid(QrCheckinRequest request) {
        if (request.getUserLat() == null || request.getUserLng() == null || 
            request.getAdminLat() == null || request.getAdminLng() == null) {
            return false;
        }
        double distance = calculateDistance(request.getUserLat(), request.getUserLng(), 
                                            request.getAdminLat(), request.getAdminLng());
        return distance > 50.0;
    }

    private boolean isSignatureMissing(QrCheckinRequest request) {
        return request.getSignature() == null || request.getSignature().isEmpty();
    }

    private Checkin processCheckinRecord(User user, CheckinType type, String signature) {
        Checkin saved = checkInService.performCheckIn(user, type);
        if (signature != null && !signature.isEmpty()) {
            String fileName = localFileSystemService.saveSignature(signature);
            saved.setSignature(fileName);
            saved = checkInService.save(saved);
        }
        return saved;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        int earthRadius = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c * 1000;
    }
}