package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineCheckinRequest {

    @NotNull
    private Double userLat;

    @NotNull
    private Double userLng;

    private String signature;

    private LocalDateTime offlineTimestamp;

    private String qrHash;

    private CheckinType checkInType;
}
