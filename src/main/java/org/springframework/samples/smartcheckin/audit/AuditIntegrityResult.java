package org.springframework.samples.smartcheckin.audit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditIntegrityResult {
    private boolean valid;
    private Integer tamperedLogId;
    private String message;
    private int totalLogsVerified;
}
