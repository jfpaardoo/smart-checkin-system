package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.samples.smartcheckin.model.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false, exclude = {"attendances"})
@Entity
@Table(name = "formations")
public class Formation extends BaseEntity {

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 255)
    private String description;

    @NotNull
    @Future
    private LocalDateTime formationDate;

    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("formation")
    private List<FormationAttendance> attendances = new ArrayList<>();

}
