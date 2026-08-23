package org.springframework.samples.smartcheckin.formation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloseFormationRequest {

    private String signature;
    private String observations;
    private String trainerName;
    private String location;
}
