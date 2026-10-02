package org.springframework.samples.smartcheckin.auth.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {
    
    @NotBlank(message = "El usuario o correo electrónico es obligatorio")
    private String email;

    @NotBlank(message = "El token del captcha es obligatorio")
    private String captchaToken;
}