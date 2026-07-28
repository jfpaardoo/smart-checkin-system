package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;

import org.springframework.samples.smartcheckin.model.BaseEntity;
import org.springframework.samples.smartcheckin.user.User;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true, exclude = {"formation", "user"})
@Entity
@Table(name = "formation_attendances")
public class FormationAttendance extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "formation_id")
    @JsonIgnoreProperties("attendances")
    private Formation formation;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties("formationAttendances")
    private User user;

    private LocalDateTime checkInDate;

    private LocalDateTime checkOutDate;

    @Column(columnDefinition = "TEXT")
    private String signature;
}
