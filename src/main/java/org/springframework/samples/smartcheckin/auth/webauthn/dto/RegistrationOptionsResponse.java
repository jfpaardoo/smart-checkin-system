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
public class RegistrationOptionsResponse {

    private String challenge;
    private Rp rp;
    private UserDetails user;
    private List<PubKeyCredParam> pubKeyCredParams;
    private AuthenticatorSelection authenticatorSelection;
    private Long timeout;
    private String attestation;
    private List<Descriptor> excludeCredentials;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Rp {
        private String name;
        private String id;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDetails {
        private String id;
        private String name;
        private String displayName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PubKeyCredParam {
        private String type;
        private Integer alg;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthenticatorSelection {
        private String authenticatorAttachment;
        private String residentKey;
        private String userVerification;
        private Boolean requireResidentKey;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Descriptor {
        private String type;
        private String id;
    }
}
