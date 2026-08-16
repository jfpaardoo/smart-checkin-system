package org.springframework.samples.smartcheckin.audit;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1/audit")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    @Autowired
    public AuditController(AuditLogRepository auditLogRepository, AuditService auditService) {
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    @GetMapping("/verify-integrity")
    @PreAuthorize("hasAuthority('ADMIN')")
    public org.springframework.http.ResponseEntity<AuditIntegrityResult> verifyIntegrity() {
        AuditIntegrityResult result = auditService.verifyIntegrity();
        return org.springframework.http.ResponseEntity.ok(result);
    }

    @GetMapping("/csv")
    @PreAuthorize("hasAuthority('ADMIN')")
    public org.springframework.http.ResponseEntity<byte[]> exportAuditCsv() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,Timestamp,Action,Username,Details,IP Address\n");

        for (AuditLog log : logs) {
            csvBuilder.append(log.getId()).append(",")
                    .append(log.getTimestamp() != null ? log.getTimestamp().toString() : "").append(",")
                    .append(log.getAction() != null ? log.getAction().replace(",", " ") : "").append(",")
                    .append(log.getUsername() != null ? log.getUsername().replace(",", " ") : "").append(",")
                    .append(log.getDetails() != null ? log.getDetails().replace(",", " ").replace("\n", " ") : "").append(",")
                    .append(log.getIpAddress() != null ? log.getIpAddress().replace(",", " ") : "")
                    .append("\n");
        }

        byte[] csvBytes = csvBuilder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "audit.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new org.springframework.http.ResponseEntity<>(csvBytes, headers, org.springframework.http.HttpStatus.OK);
    }
}
