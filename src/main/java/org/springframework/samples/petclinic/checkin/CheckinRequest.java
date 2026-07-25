package org.springframework.samples.petclinic.checkin;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckinRequest {

    @NotNull
    private CheckinType checkInType;
    
}
