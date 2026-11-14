package org.springframework.samples.smartcheckin.audit;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<Object> getAuditLogs(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "50") Integer size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String username) {
        if (page != null) {
            Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
            Page<AuditLog> paged;
            if ((action != null && !action.isBlank()) || (username != null && !username.isBlank())) {
                paged = auditLogRepository.searchAuditLogsPaged(
                        (action != null && !action.isBlank()) ? action.trim() : null,
                        (username != null && !username.isBlank()) ? username.trim() : null,
                        pageable);
            } else {
                paged = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
            }
            return ResponseEntity.ok(paged);
        }
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/verify-integrity")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AuditIntegrityResult> verifyIntegrity() {
        AuditIntegrityResult result = auditService.verifyIntegrity();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/csv")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportAuditCsv() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,Timestamp,Action,Username,Details,IP Address\n");

        for (AuditLog log : logs) {
            csvBuilder.append(log.getId()).append(",")
                    .append(log.getTimestamp() != null ? log.getTimestamp().toString() : "").append(",")
                    .append(escapeCsvField(log.getAction())).append(",")
                    .append(escapeCsvField(log.getUsername())).append(",")
                    .append(escapeCsvField(log.getDetails())).append(",")
                    .append(escapeCsvField(log.getIpAddress()))
                    .append("\n");
        }

        byte[] csvBytes = csvBuilder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "audit.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    private String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }
        String clean = field.replace("\r", " ").replace("\n", " ");
        // Prevent CSV / Formula Injection (CWE-1236)
        if (clean.startsWith("=") || clean.startsWith("+") || clean.startsWith("-") || clean.startsWith("@") || clean.startsWith("\t")) {
            clean = "'" + clean;
        }
        if (clean.contains(",") || clean.contains("\"") || clean.contains("'")) {
            clean = "\"" + clean.replace("\"", "\"\"") + "\"";
        }
        return clean;
    }
}
