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
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
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
import org.springframework.samples.smartcheckin.formation.FormationStatus;
import org.springframework.samples.smartcheckin.notification.NotificationContext;

@RestController
@RequestMapping("/api/v1/checkins")
@SecurityRequirement(name = "bearerAuth")
public class CheckinRestController {

    private final CheckinService checkInService;
    private final UserService userService;
    private final TotpService totpService;
    private final FormationService formationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final SignatureStorageService signatureStorageService;
    private final NotificationContext notificationContext;
    private static final String MESSAGE_KEY = "message";

    @Autowired
    public CheckinRestController(CheckinService checkInService, UserService userService, TotpService totpService, FormationService formationService, SimpMessagingTemplate messagingTemplate, SignatureStorageService signatureStorageService, NotificationContext notificationContext) {
        this.checkInService = checkInService;
        this.userService = userService;
        this.totpService = totpService;
        this.formationService = formationService;
        this.messagingTemplate = messagingTemplate;
        this.signatureStorageService = signatureStorageService;
        this.notificationContext = notificationContext;
    }

    @GetMapping("/my-history")
    public ResponseEntity<Object> getMyHistory(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "10") Integer size) {
        User currentUser = userService.findCurrentUser();
        if (page != null) {
            org.springframework.data.domain.Page<Checkin> paged = checkInService.findPagedByUserId(
                    currentUser.getId(),
                    org.springframework.data.domain.PageRequest.of(Math.max(0, page), Math.max(1, size)));
            return new ResponseEntity<>(paged, HttpStatus.OK);
        }
        List<Checkin> checkIns = checkInService.findByUserId(currentUser.getId());
        return new ResponseEntity<>(checkIns, HttpStatus.OK);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Checkin> checkIn(@RequestBody @Valid CheckinRequest request) {
        User currentUser = userService.findCurrentUser();
        Checkin saved = checkInService.performCheckIn(currentUser, request.getCheckInType());
        currentUser.setIsWorking(request.getCheckInType() == CheckinType.ENTRADA);
        userService.saveUser(currentUser);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping("/qr-fichaje")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Object> qrCheckin(@RequestBody @Valid QrCheckinRequest request) {
        User user = userService.findCurrentUser();
        Formation targetFormation = resolveFormation(request);

        injectAdminLocationIfMissing(request, targetFormation);

        if (targetFormation != null) {
            return processFormationCheckin(targetFormation, user, request);
        }

        if (request.getFormationId() != null) {
            return handleFormationTokenError(request);
        }

        return processGeneralCheckin(user, request);
    }

    private ResponseEntity<Object> processFormationCheckin(Formation targetFormation, User user, QrCheckinRequest request) {
        if (FormationStatus.DRAFT.equals(targetFormation.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "Esta formación está en borrador y no está publicada. No se admiten fichajes."));
        }

        if (Boolean.TRUE.equals(targetFormation.getIsClosed())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "Esta formación ya ha sido finalizada y cerrada. No se admiten nuevos fichajes."));
        }

        ResponseEntity<Object> locationError = validateLocation(request, user);
        if (locationError != null) return locationError;

        try {
            formationService.registerAttendance(targetFormation.getId(), user, request.getWithinWorkingHours());
            messagingTemplate.convertAndSend("/topic/formations", "UPDATED");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("formationId", targetFormation.getId());
            responseBody.put("formationName", targetFormation.getName());

            Map<String, String> checkinInfo = new HashMap<>();
            checkinInfo.put("type", "ENTRADA");
            responseBody.put("checkin", checkinInfo);

            return new ResponseEntity<>(responseBody, HttpStatus.CREATED);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "Error al registrar en formación: " + e.getMessage()));
        }
    }

    private ResponseEntity<Object> handleFormationTokenError(QrCheckinRequest request) {
        List<Formation> all = formationService.findAll();
        boolean isOtherFormation = all.stream().anyMatch(f -> totpService.verifyToken(request.getToken(), f.getId()));
        if (isOtherFormation) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "El código o QR escaneado pertenece a otra formación diferente."));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(MESSAGE_KEY, "El código o QR de formación ha expirado o no es válido."));
    }

    private ResponseEntity<Object> processGeneralCheckin(User user, QrCheckinRequest request) {
        if (!totpService.verifyToken(request.getToken())) {
            List<Formation> all = formationService.findAll();
            boolean isFormationToken = all.stream().anyMatch(f -> totpService.verifyToken(request.getToken(), f.getId()));
            if (isFormationToken) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(MESSAGE_KEY, "El código escaneado pertenece a una formación, no al control general de fichaje."));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "El código o QR ha expirado o no es válido."));
        }

        ResponseEntity<Object> locationError = validateLocation(request, user);
        if (locationError != null) return locationError;

        CheckinType type = (Boolean.TRUE.equals(user.getIsWorking())) ? CheckinType.SALIDA : CheckinType.ENTRADA;

        if (type == CheckinType.SALIDA && isSignatureMissing(request)) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of("needsSignature", true, MESSAGE_KEY, "Signature required for checkout"));
        }

        Checkin saved = processCheckinRecord(user, type, request.getSignature());

        try {
            String notifTitle = type == CheckinType.ENTRADA ? "Entrada registrada" : "Salida registrada";
            String notifBody  = type == CheckinType.ENTRADA
                ? "Has registrado tu entrada correctamente."
                : "Has registrado tu salida correctamente.";
            notificationContext.sendNotification(user, notifTitle, notifBody);
        } catch (Exception e) {
            // Non-critical: no bloquear el fichaje si la notificación falla
        }

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("checkin", saved);

        return new ResponseEntity<>(responseBody, HttpStatus.CREATED);
    }

    private void injectAdminLocationIfMissing(QrCheckinRequest request, Formation targetFormation) {
        if (request.getAdminLat() == null || request.getAdminLng() == null) {
            Object cacheKey = (targetFormation != null) ? targetFormation.getId() : null;
            double[] cachedLoc = totpService.getCachedAdminLocation(cacheKey);
            if (cachedLoc != null) {
                request.setAdminLat(cachedLoc[0]);
                request.setAdminLng(cachedLoc[1]);
            }
        }
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

    private boolean isSignatureMissing(QrCheckinRequest request) {
        return request.getSignature() == null || request.getSignature().isEmpty();
    }

    private ResponseEntity<Object> validateLocation(QrCheckinRequest request, User user) {
        if (request.getUserLat() == null || request.getUserLng() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(MESSAGE_KEY, "Se requiere ubicación GPS activa para fichar."));
        }

        // Si faltan coordenadas dinámicas de admin, intentar usar las coordenadas de la sede de empresa del usuario
        if ((request.getAdminLat() == null || request.getAdminLng() == null) 
                && user != null && user.getCompany() != null 
                && user.getCompany().getLatitude() != null && user.getCompany().getLongitude() != null) {
            request.setAdminLat(user.getCompany().getLatitude());
            request.setAdminLng(user.getCompany().getLongitude());
        }

        if (request.getAdminLat() == null || request.getAdminLng() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(MESSAGE_KEY, "El código no contiene ubicación válida del administrador para validar la distancia."));
        }

        int maxRadius = 50;
        if (user != null && user.getCompany() != null && user.getCompany().getRadiusMeters() != null && user.getCompany().getRadiusMeters() > 0) {
            maxRadius = user.getCompany().getRadiusMeters();
        }

        double distance = calculateDistance(request.getUserLat(), request.getUserLng(), 
                                            request.getAdminLat(), request.getAdminLng());
        if (distance > maxRadius) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(MESSAGE_KEY, "Demasiado lejos del punto de control o sede. Distancia: " + Math.round(distance) + "m (Máx permitido: " + maxRadius + "m)"));
        }
        return null;
    }

    private Checkin processCheckinRecord(User user, CheckinType type, String signature) {
        Checkin saved = checkInService.performCheckIn(user, type);
        if (signature != null && !signature.isEmpty()) {
            String fileName = signatureStorageService.saveSignature(signature, "checkins");
            saved.setSignature(fileName);
            saved = checkInService.save(saved);
        }
        user.setIsWorking(type == CheckinType.ENTRADA);
        userService.saveUser(user);
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