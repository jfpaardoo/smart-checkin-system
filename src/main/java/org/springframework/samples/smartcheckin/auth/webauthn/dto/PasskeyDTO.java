package org.springframework.samples.smartcheckin.auth.webauthn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasskeyDTO {
    private Integer id;
    private String credentialId;
    private String nickname;
    private String deviceType;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
}
