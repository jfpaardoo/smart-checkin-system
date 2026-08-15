package org.springframework.samples.smartcheckin.auth.payload.request;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank(message = "El token del captcha es obligatorio")
    private String captchaToken;
}