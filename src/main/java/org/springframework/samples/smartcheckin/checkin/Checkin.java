package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import org.springframework.samples.smartcheckin.model.BaseEntity;
import org.springframework.samples.smartcheckin.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "checkins", indexes = {
    @Index(name = "idx_checkins_user_id", columnList = "user_id"),
    @Index(name = "idx_checkins_check_in_date", columnList = "checkInDate"),
    @Index(name = "idx_checkins_user_date", columnList = "user_id, checkInDate"),
    @Index(name = "idx_checkins_offline", columnList = "is_offline, user_id")
})
public class Checkin extends BaseEntity {

    @NotNull
    private LocalDateTime checkInDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    private CheckinType checkInType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @NotNull
    @JsonIgnore
    private User user;

    @Column(columnDefinition = "TEXT")
    private String signature;

    @Column(name = "is_auto_checkout")
    private Boolean isAutoCheckout;

    @Column(name = "is_rectified")
    private Boolean isRectified;

    @Column(name = "rectified_checkout_date")
    private LocalDateTime rectifiedCheckOutDate;

    @Column(name = "rectification_notes", columnDefinition = "TEXT")
    private String rectificationNotes;

    @Column(name = "is_offline")
    @Builder.Default
    private Boolean isOffline = false;

    @Column(name = "offline_timestamp")
    private LocalDateTime offlineTimestamp;

    @Column(name = "offline_qr_hash", length = 64)
    private String offlineQrHash;

    @Column(name = "offline_event_id", length = 64)
    private String offlineEventId;
}
