package org.springframework.samples.smartcheckin.auth.session;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSessionDTO {
    private Integer id;
    private String ipAddress;
    private String userAgent;
    private String deviceInfo;
    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;
    private boolean isCurrent;
}
