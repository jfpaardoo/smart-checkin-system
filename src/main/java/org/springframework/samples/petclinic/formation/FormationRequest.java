package org.springframework.samples.petclinic.formation;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FormationRequest {
    
    @NotBlank
    private String name;

    private String description;

    @NotNull
    private LocalDateTime formationDate;
}
