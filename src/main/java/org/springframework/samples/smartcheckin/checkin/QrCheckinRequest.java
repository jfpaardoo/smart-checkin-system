package org.springframework.samples.smartcheckin.checkin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QrCheckinRequest {
    
    @NotBlank
    @Size(min = 4, max = 4, message = "Personal code must be exactly 4 characters")
    private String personalCode;

    @NotBlank
    @Size(min = 6, max = 6, message = "TOTP token must be exactly 6 characters")
    private String token;

    private String signature;
}
