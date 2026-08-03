package org.springframework.samples.smartcheckin.push;

import lombok.Data;

@Data
public class PushSubscriptionDTO {
    private String endpoint;
    private String expirationTime;
    private Keys keys;

    @Data
    public static class Keys {
        private String p256dh;
        private String auth;
    }
}
