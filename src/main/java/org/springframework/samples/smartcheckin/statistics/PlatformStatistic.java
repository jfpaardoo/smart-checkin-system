package org.springframework.samples.smartcheckin.statistics;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import org.springframework.samples.smartcheckin.model.BaseEntity;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "platform_statistics")
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class PlatformStatistic extends BaseEntity {

    private LocalDate date;
    private Long totalCheckins;
    private Double averageHoursPerEmployee;
    private Long activeFormations;
    private Double formationAttendanceRate;

}
