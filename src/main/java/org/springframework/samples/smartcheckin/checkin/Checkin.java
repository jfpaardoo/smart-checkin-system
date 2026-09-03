package org.springframework.samples.smartcheckin.checkin;

import java.time.LocalDateTime;
import org.springframework.samples.smartcheckin.model.BaseEntity;
import org.springframework.samples.smartcheckin.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@org.jpatterns.gof.BuilderPattern.Builder
@lombok.Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "checkins", indexes = {
    @Index(name = "idx_checkins_user_id", columnList = "user_id"),
    @Index(name = "idx_checkins_check_in_date", columnList = "checkInDate"),
    @Index(name = "idx_checkins_user_date", columnList = "user_id, checkInDate")
})
public class Checkin extends BaseEntity {

    @NotNull
    private LocalDateTime checkInDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    private CheckinType checkInType;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @NotNull
    @JsonIgnore
    private User user;

    @Column(columnDefinition = "TEXT")
    private String signature;
}
