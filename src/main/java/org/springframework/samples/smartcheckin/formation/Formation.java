package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.samples.smartcheckin.model.BaseEntity;
import org.springframework.samples.smartcheckin.user.User;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false, exclude = {"attendees"})
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

    @ManyToMany
    @JoinTable(
        name = "formation_attendees", 
        joinColumns = @JoinColumn(name = "formation_id"), 
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> attendees = new ArrayList<>();

}
