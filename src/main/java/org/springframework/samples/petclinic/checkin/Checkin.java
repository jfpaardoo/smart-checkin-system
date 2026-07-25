package org.springframework.samples.petclinic.checkin;

import java.time.LocalDateTime;
import org.springframework.samples.petclinic.model.BaseEntity;
import org.springframework.samples.petclinic.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "checkins")
public class Checkin extends BaseEntity {

    @NotNull
    private LocalDateTime checkInDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    private CheckinType checkInType;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @NotNull
    private User user;
}
