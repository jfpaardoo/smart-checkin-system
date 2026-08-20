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
public class UserFormationExportDTO {
    private Integer userId;
    private String username;
    private String personalCode;
    private String fullName;
    private String email;
    private String locator;
    private Integer companyId;
    private String companyName;
    private String authority;
    private Boolean isWorking;

    private Integer formationId;
    private String formationName;
    private String formationDescription;
    private LocalDateTime formationDate;

    private LocalDateTime checkInDate;
    private LocalDateTime checkOutDate;
    private Long durationMinutes;
    private String durationHoursFormatted;
    private String status; // "ASISTIÓ", "NO ASISTIÓ", "EN CURSO", "PENDIENTE"
    private Boolean hasSignature;
    private String signature;
    private String verificationHash;
}
