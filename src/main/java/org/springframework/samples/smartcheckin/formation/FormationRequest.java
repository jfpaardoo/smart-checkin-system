package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.util.List;

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

    private List<String> existingDocumentUrls;
}
