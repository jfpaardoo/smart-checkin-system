package org.springframework.samples.smartcheckin.formation;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/formations")
@Tag(name = "Formations", description = "The Formations API based on JWT")
@SecurityRequirement(name = "bearerAuth")
public class FormationRestController {

    private final FormationService formationService;

    @Autowired
    public FormationRestController(FormationService formationService) {
        this.formationService = formationService;
    }

    @GetMapping
    public ResponseEntity<List<Formation>> getAllFormations() {
        return ResponseEntity.ok(formationService.findAll());
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
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/attend")
    public ResponseEntity<String> registerAttendance(@PathVariable Integer id, @Valid @RequestBody AttendRequest request) {
        try {
            formationService.registerAttendance(id, request.getPersonalCode());
            return ResponseEntity.ok("Successfully registered attendance");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Failed to register: " + e.getMessage());
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
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{formationId}/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> addAttendee(@PathVariable Integer formationId, @PathVariable Integer userId) {
        try {
            formationService.addAttendee(formationId, userId);
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
            return ResponseEntity.ok("Successfully removed attendee");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to remove attendee: " + e.getMessage());
        }
    }
}
