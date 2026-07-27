package org.springframework.samples.smartcheckin.formation;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;

@RestController
@RequestMapping("/api/v1/formations")
@Tag(name = "Formations", description = "The Formations API based on JWT")
@SecurityRequirement(name = "bearerAuth")
public class FormationRestController {

    private static final String MESSAGE_KEY = "message";

    private final FormationService formationService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public FormationRestController(FormationService formationService, UserService userService, SimpMessagingTemplate messagingTemplate) {
        this.formationService = formationService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    private void notifyFormationsUpdate(Integer formationId) {
        try {
            messagingTemplate.convertAndSend("/topic/formations", "UPDATED");
            if (formationId != null) {
                messagingTemplate.convertAndSend("/topic/formations/" + formationId, "UPDATED");
            }
        } catch (Exception e) {
            // Ignore messaging error
        }
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

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Formation> createFormation(@Valid @RequestBody FormationRequest request) {
        Formation formation = new Formation();
        formation.setName(request.getName());
        formation.setDescription(request.getDescription());
        formation.setFormationDate(request.getFormationDate());
        
        Formation saved = formationService.saveFormation(formation);
        notifyFormationsUpdate(saved.getId());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/attend")
    public ResponseEntity<Object> registerAttendance(@PathVariable Integer id, @RequestBody(required = false) AttendRequest request) {
        try {
            String code = (request != null && request.getPersonalCode() != null && !request.getPersonalCode().isBlank()) 
                ? request.getPersonalCode() 
                : userService.findCurrentUser().getPersonalCode();
            Formation formation = formationService.registerAttendance(id, code);
            notifyFormationsUpdate(id);
            return ResponseEntity.ok(formation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Failed to register: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<Object> checkoutAttendance(@PathVariable Integer id, @Valid @RequestBody FormationCheckoutRequest request) {
        try {
            User currentUser = userService.findCurrentUser();
            Formation formation = formationService.checkoutAttendance(id, currentUser.getPersonalCode(), request.getSignature());
            notifyFormationsUpdate(id);
            return ResponseEntity.ok(formation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Failed to checkout: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Formation> updateFormation(@PathVariable Integer id, @Valid @RequestBody FormationRequest request) {
        Formation formation = new Formation();
        formation.setName(request.getName());
        formation.setDescription(request.getDescription());
        formation.setFormationDate(request.getFormationDate());
        
        Formation updated = formationService.updateFormation(formation, id);
        notifyFormationsUpdate(id);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{formationId}/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> addAttendee(@PathVariable Integer formationId, @PathVariable Integer userId) {
        try {
            formationService.addAttendee(formationId, userId);
            notifyFormationsUpdate(formationId);
            return ResponseEntity.ok("Successfully added attendee");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add attendee: " + e.getMessage());
        }
    }

    @DeleteMapping("/{formationId}/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> removeAttendee(@PathVariable Integer formationId, @PathVariable Integer userId) {
        try {
            formationService.removeAttendee(formationId, userId);
            notifyFormationsUpdate(formationId);
            return ResponseEntity.ok("Successfully removed attendee");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to remove attendee: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Object> deleteFormation(@PathVariable Integer id) {
        try {
            formationService.deleteFormation(id);
            notifyFormationsUpdate(id);
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Formación eliminada correctamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(MESSAGE_KEY, "Error al eliminar la formación: " + e.getMessage()));
        }
    }
}