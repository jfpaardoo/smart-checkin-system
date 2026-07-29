package org.springframework.samples.smartcheckin.formation;

import java.util.ArrayList;
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

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/formations")
@Tag(name = "Formations", description = "The Formations API. Contains all the operations that can be performed on a formation.")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class FormationRestController {

    private static final String MESSAGE_KEY = "message";

    private final FormationService formationService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private final org.springframework.samples.smartcheckin.settings.OneDriveService oneDriveService;

    @Autowired
    public FormationRestController(FormationService formationService, UserService userService, SimpMessagingTemplate messagingTemplate, org.springframework.samples.smartcheckin.settings.OneDriveService oneDriveService) {
        this.formationService = formationService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
        this.oneDriveService = oneDriveService;
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

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Formation> createFormation(
            @RequestPart("formation") @Valid FormationRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        
        Formation formation = new Formation();
        formation.setName(request.getName());
        formation.setDescription(request.getDescription());
        formation.setFormationDate(request.getFormationDate());
        
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String link = oneDriveService.uploadFile(file, request.getName());
                        formation.getDocumentUrls().add(link);
                    } catch (Exception e) {
                        log.error("Error uploading file: {}", e.getMessage(), e);
                    }
                }
            }
        }
        
        Formation saved = formationService.saveFormation(formation);
        notifyFormationsUpdate(saved.getId());
        return ResponseEntity.ok(saved);
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Formation> updateFormation(
            @PathVariable Integer id,
            @RequestPart("formation") @Valid FormationRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        
        Formation existing = formationService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Formation not found"));
            
        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        existing.setFormationDate(request.getFormationDate());
        
        // Retain only existing URLs that are still present in the request
        List<String> toKeep = request.getExistingDocumentUrls();
        if (toKeep == null) {
            toKeep = new ArrayList<>();
        }
        existing.getDocumentUrls().retainAll(toKeep);
        
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String link = oneDriveService.uploadFile(file, request.getName());
                        existing.getDocumentUrls().add(link);
                    } catch (Exception e) {
                        log.error("Error uploading file: {}", e.getMessage(), e);
                    }
                }
            }
        }
        
        Formation saved = formationService.updateFormation(existing, id);
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

    // 🚀 FIX: Cambiado a "/attendances" para coincidir con React y adaptado para recibir el JSON
    @PostMapping("/{formationId}/attendances")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> addAttendee(@PathVariable Integer formationId, @RequestBody Map<String, Integer> payload) {
        try {
            Integer userId = payload.get("userId");
            formationService.addAttendee(formationId, userId);
            notifyFormationsUpdate(formationId);
            return ResponseEntity.ok("Successfully added attendee");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add attendee: " + e.getMessage());
        }
    }

    @DeleteMapping("/{formationId}/attendances/{userId}")
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