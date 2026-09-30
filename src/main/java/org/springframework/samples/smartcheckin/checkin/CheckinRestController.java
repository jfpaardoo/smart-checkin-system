package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size) {
        User currentUser = userService.findCurrentUser();
        if (page != null) {
            Page<Checkin> paged = checkInService.findPagedByUserId(
                    currentUser.getId(),
                    PageRequest.of(Math.max(0, page), Math.max(1, size)));
            return new ResponseEntity<>(paged, HttpStatus.OK);
        }
        List<Checkin> checkIns = checkInService.findByUserId(currentUser.getId());
        return new ResponseEntity<>(checkIns, HttpStatus.OK);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Checkin> checkIn(@RequestBody @Valid CheckinRequest request) {
        User currentUser = userService.findCurrentUser();
        if (currentUser == null || currentUser.getAuthority() == null
                || (!"ADMIN".equalsIgnoreCase(currentUser.getAuthority().getAuthority())
                    && !"HR_MANAGER".equalsIgnoreCase(currentUser.getAuthority().getAuthority()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
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

        injectAdminLocation(request, targetFormation, user);

        if (targetFormation != null) {
            return processFormationCheckin(targetFormation, user, request);
        }

        if (request.getFormationId() != null) {
            return handleFormationTokenError(request);
        }

        return processGeneralCheckin(user, request);
    }

    @PostMapping("/offline-batch")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Object> processOfflineBatch(@RequestBody List<OfflineCheckinRequest> requests) {
        User user = userService.findCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (requests == null || requests.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, "La lista de fichajes offline no puede estar vacía."));
        }

        List<Checkin> processed = new ArrayList<>();
        for (OfflineCheckinRequest req : requests) {
            if (req.getSignature() != null && !req.getSignature().isEmpty()) {
                String fileName = signatureStorageService.saveSignature(req.getSignature(), "checkins");
                req.setSignature(fileName);
            }
            Checkin saved = checkInService.recordOfflineCheckin(user, req);
            processed.add(saved);
        }

        userService.saveUser(user);

        return new ResponseEntity<>(Map.of(
                "message", "Fichajes offline registrados con éxito. Pendientes de validación.",
                "count", processed.size(),
                "checkins", processed
        ), HttpStatus.CREATED);
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

        if (request.getToken() != null && totpService.isTokenConsumedForUser(request.getToken(), user.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "El código o QR ya ha sido utilizado para este fichaje en formación."));
        }

        try {
            formationService.registerAttendance(targetFormation.getId(), user, request.getWithinWorkingHours());
            if (request.getToken() != null) {
                totpService.markTokenConsumedForUser(request.getToken(), user.getId());
            }
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
        if (totpService.isTokenConsumedForUser(request.getToken(), user.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "El código o QR ya ha sido utilizado para este fichaje."));
        }

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
        totpService.markTokenConsumedForUser(request.getToken(), user.getId());

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

    private void injectAdminLocation(QrCheckinRequest request, Formation targetFormation, User user) {
        // C5 Anti-spoofing: Las coordenadas de referencia provienen exclusivamente del servidor
        Object cacheKey = (targetFormation != null) ? targetFormation.getId() : null;
        double[] cachedLoc = totpService.getCachedAdminLocation(cacheKey);
        if (cachedLoc != null) {
            request.setAdminLat(cachedLoc[0]);
            request.setAdminLng(cachedLoc[1]);
        } else if (user != null && user.getCompany() != null 
                && user.getCompany().getLatitude() != null && user.getCompany().getLongitude() != null) {
            request.setAdminLat(user.getCompany().getLatitude());
            request.setAdminLng(user.getCompany().getLongitude());
        } else {
            // Limpiar cualquier coordenada que el cliente intente inyectar maliciosamente
            request.setAdminLat(null);
            request.setAdminLng(null);
        }
    }

    private Formation resolveFormation(QrCheckinRequest request) {
        if (request.getFormationId() != null) {
            Integer id = parseFormationId(request.getFormationId());
            return id != null ? resolveFormationById(request, id, request.getFormationId()) : null;
        }

        List<Formation> activeFormations = formationService.findActiveFormationsForToday();
        if (activeFormations == null || activeFormations.isEmpty()) {
            activeFormations = formationService.findAll();
        }
        for (Formation f : activeFormations) {
            if (totpService.verifyToken(request.getToken(), f.getId())) {
                return f;
            }
        }
        return null;
    }

    private Integer parseFormationId(Object reqId) {
        if (reqId instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(reqId));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Formation resolveFormationById(QrCheckinRequest request, Integer id, Object reqId) {
        if (!totpService.verifyToken(request.getToken(), id)) {
            return null;
        }
        Formation f = formationService.findById(id).orElse(null);
        if (f != null) {
            return f;
        }
        return formationService.findAll().stream()
                .filter(item -> String.valueOf(item.getId()).equals(String.valueOf(reqId)))
                .findFirst()
                .orElse(null);
    }

    private boolean isSignatureMissing(QrCheckinRequest request) {
        return request.getSignature() == null || request.getSignature().isEmpty();
    }

    private ResponseEntity<Object> validateLocation(QrCheckinRequest request, User user) {
        if (request.getUserLat() == null || request.getUserLng() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(MESSAGE_KEY, "Se requiere ubicación GPS activa para fichar."));
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
        String fileName = null;
        if (signature != null && !signature.isEmpty()) {
            fileName = signatureStorageService.saveSignature(signature, "checkins");
        }
        Checkin saved = checkInService.executeTransactionalCheckin(user, fileName, type);
        if (saved == null) {
            saved = checkInService.performCheckIn(user, type);
            if (fileName != null) {
                saved.setSignature(fileName);
                saved = checkInService.save(saved);
            }
        }
        user.setIsWorking(type == CheckinType.ENTRADA);
        userService.saveUser(user);
        return saved;
    }

    @GetMapping("/pending-rectifications")
    public ResponseEntity<List<Checkin>> getPendingRectifications() {
        User currentUser = userService.findCurrentUser();
        List<Checkin> pending = checkInService.findPendingAutoCheckoutRectifications(currentUser.getId());
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/{id}/rectify")
    public ResponseEntity<Object> rectifyCheckin(@PathVariable Integer id,
                                                 @RequestBody @Valid RectifyCheckinRequest request) {
        User currentUser = userService.findCurrentUser();
        Optional<Checkin> optionalCheckin = checkInService.findById(id);

        if (optionalCheckin.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(MESSAGE_KEY, "Fichaje no encontrado."));
        }

        Checkin checkin = optionalCheckin.get();

        // Verificar pertenencia o rol ADMIN
        boolean isAdmin = currentUser.getAuthority() != null && "ADMIN".equalsIgnoreCase(currentUser.getAuthority().getAuthority());
        if (!isAdmin && (checkin.getUser() == null || !checkin.getUser().getId().equals(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(MESSAGE_KEY, "No tienes permiso para rectificar este fichaje."));
        }

        if (!Boolean.TRUE.equals(checkin.getIsAutoCheckout())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "Solo las salidas provisionales automáticas admiten rectificación."));
        }

        if (Boolean.TRUE.equals(checkin.getIsRectified())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "Este fichaje ya ha sido rectificado previamente."));
        }

        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        if (request.getRectifiedDate().isAfter(now)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(MESSAGE_KEY, "La fecha de salida rectificada no puede ser futura."));
        }

        checkin.setRectifiedCheckOutDate(request.getRectifiedDate());
        checkin.setCheckInDate(request.getRectifiedDate());
        checkin.setIsRectified(true);

        if (request.getSignature() != null && !request.getSignature().isBlank()) {
            String fileName = signatureStorageService.saveSignature(request.getSignature(), "rectifications");
            checkin.setSignature(fileName);
        }

        String notes = checkin.getRectificationNotes() != null ? checkin.getRectificationNotes() : "";
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            notes += " [Nota rectificación: " + request.getNotes().trim() + "]";
        }
        checkin.setRectificationNotes(notes + " (Rectificado el " + now + ")");

        Checkin updated = checkInService.save(checkin);

        try {
            notificationContext.sendNotification(checkin.getUser(),
                    "Fichaje rectificado correctamente",
                    "Tu salida del " + checkin.getCheckInDate().toLocalDate() + " ha sido confirmada y registrada con firma digital.");
        } catch (Exception e) {
            // Ignorar fallo no crítico de notificación
        }

        return ResponseEntity.ok(updated);
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