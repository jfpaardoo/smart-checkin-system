package org.springframework.samples.petclinic.formation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendRequest {
    @NotBlank
    @Size(min = 4, max = 4)
    private String personalCode;
}
