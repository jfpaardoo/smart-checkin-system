package org.springframework.samples.smartcheckin.auth.webauthn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginOptionsResponse {

    private String challenge;
    private Long timeout;
    private String rpId;
    private String userVerification;
    private List<Descriptor> allowCredentials;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Descriptor {
        private String type;
        private String id;
    }
}
