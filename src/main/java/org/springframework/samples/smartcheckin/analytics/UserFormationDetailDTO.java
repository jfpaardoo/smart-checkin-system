package org.springframework.samples.smartcheckin.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFormationDetailDTO {
    private Integer formationId;
    private String formationName;
    private String description;
    private LocalDateTime formationDate;
    private LocalDateTime checkInDate;
    private LocalDateTime checkOutDate;
    private Long durationMinutes;
    private Boolean hasSignature;
    private String signature;
    private String status; // "COMPLETED", "IN_PROGRESS", "PENDING"
}
