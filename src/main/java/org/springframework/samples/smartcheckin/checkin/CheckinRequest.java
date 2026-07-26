package org.springframework.samples.smartcheckin.checkin;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckinRequest {

    @NotNull
    private CheckinType checkInType;
    
}
