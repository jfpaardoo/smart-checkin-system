package org.springframework.samples.smartcheckin.exports;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1/certificates")
@SecurityRequirement(name = "bearerAuth")
public class CertificateController {

    private final CertificateGeneratorService certificateGeneratorService;
    private final FormationAttendanceRepository attendanceRepository;

    @Autowired
    public CertificateController(CertificateGeneratorService certificateGeneratorService,
                                 FormationAttendanceRepository attendanceRepository) {
        this.certificateGeneratorService = certificateGeneratorService;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping("/attendance/{attendanceId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('EMPLOYEE')")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable Integer attendanceId) {
        if (attendanceId == null) {
            return ResponseEntity.badRequest().build();
        }
        FormationAttendance attendance = attendanceRepository.findById(attendanceId).orElse(null);
        
        if (attendance == null || attendance.getCheckInDate() == null || attendance.getCheckOutDate() == null) {
            return ResponseEntity.notFound().build();
        }

        // Security check: Only admins or the user themselves can download the certificate
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));
        boolean isOwner = auth.getName().equals(attendance.getUser().getUsername());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403).build();
        }

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String filename = "Certificado_" + attendance.getUser().getPersonalCode() + ".pdf";
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
