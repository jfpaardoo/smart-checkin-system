package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
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
public class CheckinResponseDTO {

    private Integer id;
    private LocalDateTime checkInDate;
    private CheckinType checkInType;
    private Integer userId;
    private String username;
    private Boolean hasSignature;
    private Boolean isAutoCheckout;
    private Boolean isRectified;
    private LocalDateTime rectifiedCheckOutDate;
    private Boolean isOffline;
    private LocalDateTime offlineTimestamp;

    public static CheckinResponseDTO fromEntity(Checkin checkin) {
        if (checkin == null) {
            return null;
        }
        return CheckinResponseDTO.builder()
                .id(checkin.getId())
                .checkInDate(checkin.getCheckInDate())
                .checkInType(checkin.getCheckInType())
                .userId(checkin.getUser() != null ? checkin.getUser().getId() : null)
                .username(checkin.getUser() != null ? checkin.getUser().getUsername() : null)
                .hasSignature(checkin.getSignature() != null && !checkin.getSignature().isBlank())
                .isAutoCheckout(checkin.getIsAutoCheckout())
                .isRectified(checkin.getIsRectified())
                .rectifiedCheckOutDate(checkin.getRectifiedCheckOutDate())
                .isOffline(checkin.getIsOffline())
                .offlineTimestamp(checkin.getOfflineTimestamp())
                .build();
    }
}
