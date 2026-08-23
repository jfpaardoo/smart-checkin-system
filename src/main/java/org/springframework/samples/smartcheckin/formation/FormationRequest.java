package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FormationRequest {
    
    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    @NotNull
    private LocalDateTime formationDate;

    @NotBlank
    @Size(max = 255)
    private String location;

    @NotBlank
    @Size(max = 255)
    private String trainer;

    private List<String> existingDocumentUrls;
}
