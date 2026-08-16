package org.springframework.samples.smartcheckin.auth.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TwoFactorVerifyRequest {

    private String username;

    @NotBlank
    @Size(min = 6, max = 16)
    private String code;
    
    private String type;

}