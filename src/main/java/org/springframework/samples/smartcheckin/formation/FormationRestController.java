package org.springframework.samples.smartcheckin.formation;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.samples.smartcheckin.user.UserService;

@RestController
@RequestMapping("/api/v1/formations")
@Tag(name = "Formations", description = "The Formations API. Contains all the operations that can be performed on a formation.")
@SecurityRequirement(name = "bearerAuth")
public class FormationRestController {

    private static final String MESSAGE_KEY = "message";

    private final FormationService formationService;
    private final FormationCheckinFacade facade;
    private final UserService userService;

    @Autowired
    public FormationRestController(FormationService formationService, FormationCheckinFacade facade, UserService userService) {
        this.formationService = formationService;
        this.facade = facade;
        this.userService = userService;
    }

    private Formation sanitizeFormationForUser(Formation f, boolean isAdmin, User currentUser) {
        if (isAdmin) {
            return f;
        }
        boolean isClosed = Boolean.TRUE.equals(f.getIsClosed()) || FormationStatus.CLOSED.equals(f.getStatus());
        boolean hasCheckedIn = false;
        if (currentUser != null && f.getAttendances() != null) {
            hasCheckedIn = f.getAttendances().stream()
                .anyMatch(a -> a.getUser() != null && currentUser.getId().equals(a.getUser().getId()) && a.getCheckInDate() != null);
        }

        List<String> docs = (isClosed || hasCheckedIn) && f.getDocumentUrls() != null
                ? new ArrayList<>(f.getDocumentUrls())
                : new ArrayList<>();

        Formation copy = Formation.builder()
                .name(f.getName())
                .description(f.getDescription())
                .formationDate(f.getFormationDate())
                .trainer(f.getTrainer())
                .location(f.getLocation())
                .status(f.getStatus())
                .isClosed(f.getIsClosed())
                .documentUrls(docs)
                .build();
        copy.setId(f.getId());
        return copy;
    }

    private User getCurrentUserSafe() {
        try {
            return userService.findCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping
    public ResponseEntity<List<Formation>> getAllFormations(@RequestParam(required = false) String search) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));
        User currentUser = !isAdmin ? getCurrentUserSafe() : null;
        List<Formation> list = formationService.findAllVisible(isAdmin, search);
        if (!isAdmin) {
            list = list.stream().map(f -> sanitizeFormationForUser(f, false, currentUser)).toList();
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Formation> getFormationById(@PathVariable Integer id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));
        User currentUser = !isAdmin ? getCurrentUserSafe() : null;
        return formationService.findById(id)
            .filter(f -> isAdmin || !FormationStatus.DRAFT.equals(f.getStatus()))
            .map(f -> sanitizeFormationForUser(f, isAdmin, currentUser))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Object> publishFormation(
            @PathVariable Integer id,
            @RequestBody(required = false) FormationPublishRequest request) {
        try {
            Formation published = facade.publishFormation(id, request);
            return ResponseEntity.ok(published);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, e.getMessage()));
        }
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Formation> createFormation(
            @RequestPart("formation") @Valid FormationRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        Formation saved = facade.createFormation(request, files);
        return ResponseEntity.ok(saved);
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Formation> updateFormation(
            @PathVariable Integer id,
            @RequestPart("formation") @Valid FormationRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        Formation saved = facade.updateFormation(id, request, files);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/attend")
    public ResponseEntity<Object> registerAttendance(@PathVariable Integer id, @RequestBody(required = false) AttendRequest request) {
        try {
            String code = request != null ? request.getPersonalCode() : null;
            Boolean withinWorkingHours = request == null || !Boolean.FALSE.equals(request.getWithinWorkingHours());
            Formation formation = facade.registerAttendance(id, code, withinWorkingHours);
            return ResponseEntity.ok(formation);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, e.getMessage()));
        }
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<Object> checkoutAttendance(@PathVariable Integer id, @Valid @RequestBody FormationCheckoutRequest request) {
        try {
            Formation formation = facade.checkoutAttendance(id, request.getSignature(), request.getToken());
            return ResponseEntity.ok(formation);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, e.getMessage()));
        }
    }

    @PostMapping("/{formationId}/attendances")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> addAttendee(@PathVariable Integer formationId, @RequestBody Map<String, Integer> payload) {
        try {
            Integer userId = payload.get("userId");
            facade.addAttendee(formationId, userId);
            return ResponseEntity.ok("Successfully added attendee");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add attendee: " + e.getMessage());
        }
    }

    @DeleteMapping("/{formationId}/attendances/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> removeAttendee(@PathVariable Integer formationId, @PathVariable Integer userId) {
        try {
            facade.removeAttendee(formationId, userId);
            return ResponseEntity.ok("Successfully removed attendee");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to remove attendee: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Object> closeFormation(@PathVariable Integer id, @RequestBody(required = false) CloseFormationRequest request) {
        try {
            Formation closed = formationService.closeFormation(
                id, 
                request != null ? request.getSignature() : null, 
                request != null ? request.getObservations() : null, 
                request != null ? request.getTrainerName() : null,
                request != null ? request.getLocation() : null
            );
            return ResponseEntity.ok(closed);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(MESSAGE_KEY, "Error al cerrar la formación: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Object> deleteFormation(@PathVariable Integer id) {
        try {
            facade.deleteFormation(id);
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Formación eliminada correctamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(MESSAGE_KEY, "Error al eliminar la formación: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/{id}/calendar.ics", produces = "text/calendar")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('EMPLOYEE')")
    public ResponseEntity<byte[]> getFormationCalendarIcs(@PathVariable Integer id) {
        Formation f = formationService.findById(id).orElse(null);
        if (f == null) {
            return ResponseEntity.notFound().build();
        }

        java.time.format.DateTimeFormatter iCalFormat = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(java.time.ZoneOffset.UTC);
        String dtStart = f.getFormationDate() != null ? f.getFormationDate().atZone(java.time.ZoneId.systemDefault()).format(iCalFormat) : "";
        String dtEnd = f.getFormationDate() != null ? f.getFormationDate().plusHours(2).atZone(java.time.ZoneId.systemDefault()).format(iCalFormat) : dtStart;
        String now = java.time.LocalDateTime.now(java.time.ZoneId.systemDefault()).atZone(java.time.ZoneId.systemDefault()).format(iCalFormat);
        String uid = "formation-" + f.getId() + "@smartcheckin.system";

        StringBuilder ics = new StringBuilder();
        ics.append("BEGIN:VCALENDAR\r\n");
        ics.append("VERSION:2.0\r\n");
        ics.append("PRODID:-//SmartCheckin//Distribution Academy//ES\r\n");
        ics.append("CALSCALE:GREGORIAN\r\n");
        ics.append("METHOD:PUBLISH\r\n");
        ics.append("BEGIN:VEVENT\r\n");
        ics.append("UID:").append(uid).append("\r\n");
        ics.append("DTSTAMP:").append(now).append("\r\n");
        if (!dtStart.isEmpty()) ics.append("DTSTART:").append(dtStart).append("\r\n");
        if (!dtEnd.isEmpty()) ics.append("DTEND:").append(dtEnd).append("\r\n");
        ics.append("SUMMARY:").append(escapeIcs(f.getName())).append("\r\n");
        if (f.getDescription() != null) ics.append("DESCRIPTION:").append(escapeIcs(f.getDescription())).append("\r\n");
        if (f.getLocation() != null) ics.append("LOCATION:").append(escapeIcs(f.getLocation())).append("\r\n");
        ics.append("STATUS:CONFIRMED\r\n");
        ics.append("END:VEVENT\r\n");
        ics.append("END:VCALENDAR\r\n");

        byte[] bytes = ics.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/calendar; charset=utf-8"));
        String safeName = (f.getName() != null ? f.getName().replaceAll("[^a-zA-Z0-9.-]", "_") : "formation") + ".ics";
        headers.setContentDispositionFormData("attachment", safeName);

        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private String escapeIcs(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace(";", "\\;")
                   .replace(",", "\\,")
                   .replace("\n", "\\n")
                   .replace("\r", "");
    }
}