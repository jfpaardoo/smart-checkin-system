package org.springframework.samples.petclinic.formation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.samples.petclinic.model.BaseEntity;
import org.springframework.samples.petclinic.user.User;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false, exclude = {"attendees"})
@Entity
@Table(name = "formations")
public class Formation extends BaseEntity {

    @NotNull
    private String name;

    private String description;

    @NotNull
    private LocalDateTime formationDate;

    @ManyToMany
    @JoinTable(
        name = "formation_attendees", 
        joinColumns = @JoinColumn(name = "formation_id"), 
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> attendees = new ArrayList<>();

}
