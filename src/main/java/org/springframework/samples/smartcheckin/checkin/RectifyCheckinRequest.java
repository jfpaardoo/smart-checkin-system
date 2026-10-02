package org.springframework.samples.smartcheckin.checkin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RectifyCheckinRequest {

    @NotNull(message = "La fecha y hora de salida rectificada es obligatoria.")
    private LocalDateTime rectifiedDate;

    private String signature;

    private String notes;
}
