package org.springframework.samples.smartcheckin.formation;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FormationCheckoutRequest {
    @NotBlank
    private String signature;

    private String token;
}
