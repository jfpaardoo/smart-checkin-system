package org.springframework.samples.smartcheckin.storage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.exceptions.AccessDeniedException;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/signatures")
public class SignatureRestController {

    private final SignatureStorageService signatureStorageService;
    private final UserService userService;
    private final CheckinRepository checkinRepository;
    private final FormationAttendanceRepository attendanceRepository;
    private final FormationRepository formationRepository;

    @Autowired
    public SignatureRestController(SignatureStorageService signatureStorageService,
                                   UserService userService,
                                   CheckinRepository checkinRepository,
                                   FormationAttendanceRepository attendanceRepository,
                                   FormationRepository formationRepository) {
        this.signatureStorageService = signatureStorageService;
        this.userService = userService;
        this.checkinRepository = checkinRepository;
        this.attendanceRepository = attendanceRepository;
        this.formationRepository = formationRepository;
    }

    @GetMapping("/{fileName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> getSignature(@PathVariable String fileName) {
        // Sanitize the filename to prevent directory traversal attacks
        String safeFileName = fileName.replaceAll("[^a-zA-Z0-9._!\\-]", "");

        // 1. Autorización por recurso: Dueño / Formador / Admin (SEC-03)
        User currentUser = userService.findCurrentUser();
        boolean isAdmin = Boolean.TRUE.equals(currentUser.hasAuthority("ADMIN")) 
                || Boolean.TRUE.equals(currentUser.hasAuthority("ROLE_ADMIN"));

        if (!isAdmin) {
            boolean isOwnCheckin = checkinRepository.existsBySignatureAndUserId(safeFileName, currentUser.getId());
            boolean isOwnAttendance = attendanceRepository.existsBySignatureAndUserId(safeFileName, currentUser.getId());

            String fullName = ((currentUser.getFirstName() != null ? currentUser.getFirstName() : "") + " "
                    + (currentUser.getLastName() != null ? currentUser.getLastName() : "")).trim();

            boolean isTrainer = attendanceRepository.isTrainerOfAttendance(safeFileName, currentUser.getUsername(), fullName)
                    || formationRepository.isTrainerOfFormationSignature(safeFileName, currentUser.getUsername(), fullName);

            if (!isOwnCheckin && !isOwnAttendance && !isTrainer) {
                throw new AccessDeniedException("No tienes autorización para acceder a esta firma digitalizada.");
            }
        }

        byte[] image = signatureStorageService.loadSignature(safeFileName);

        if (image == null || image.length == 0) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        // 2. Detección de Content-Type real (Magic bytes PNG vs JPEG)
        MediaType mediaType = MediaType.IMAGE_PNG;
        if (image.length >= 3 && (image[0] & 0xFF) == 0xFF && (image[1] & 0xFF) == 0xD8 && (image[2] & 0xFF) == 0xFF) {
            mediaType = MediaType.IMAGE_JPEG;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentLength(image.length);
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

        return new ResponseEntity<>(image, headers, HttpStatus.OK);
    }
}
