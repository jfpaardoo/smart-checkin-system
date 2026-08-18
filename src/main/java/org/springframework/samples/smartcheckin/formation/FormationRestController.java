package org.springframework.samples.smartcheckin.formation;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

@RestController
@RequestMapping("/api/v1/formations")
@Tag(name = "Formations", description = "The Formations API. Contains all the operations that can be performed on a formation.")
@SecurityRequirement(name = "bearerAuth")
public class FormationRestController {

    private static final String MESSAGE_KEY = "message";

    private final FormationService formationService;
    private final FormationCheckinFacade facade;

    @Autowired
    public FormationRestController(FormationService formationService, FormationCheckinFacade facade) {
        this.formationService = formationService;
        this.facade = facade;
    }

    @GetMapping
    public ResponseEntity<List<Formation>> getAllFormations(@RequestParam(required = false) String search) {
        List<Formation> list = formationService.findAll();
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase().trim();
            list = list.stream().filter(f ->
                (f.getName() != null && f.getName().toLowerCase().contains(q)) ||
                (f.getDescription() != null && f.getDescription().toLowerCase().contains(q))
            ).toList();
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Formation> getFormationById(@PathVariable Integer id) {
        return formationService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
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
            Formation formation = facade.registerAttendance(id, code);
            return ResponseEntity.ok(formation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Failed to register: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<Object> checkoutAttendance(@PathVariable Integer id, @Valid @RequestBody FormationCheckoutRequest request) {
        try {
            Formation formation = facade.checkoutAttendance(id, request.getSignature(), request.getToken());
            return ResponseEntity.ok(formation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Failed to checkout: " + e.getMessage());
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
}