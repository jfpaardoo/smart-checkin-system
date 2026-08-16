package org.springframework.samples.smartcheckin.auth.webauthn.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginVerifyRequest {

    @NotBlank
    private String id;

    @NotBlank
    private String rawId;

    @NotBlank
    private String type;

    private ResponseData response;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResponseData {
        private String clientDataJSON;
        private String authenticatorData;
        private String signature;
        private String userHandle;
    }
}
