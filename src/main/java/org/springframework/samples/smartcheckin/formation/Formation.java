package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.samples.smartcheckin.model.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
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
@org.jpatterns.gof.BuilderPattern.Builder
@lombok.Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "formation_documents", joinColumns = @JoinColumn(name = "formation_id"))
    @Column(name = "document_url", length = 1000)
    @lombok.Builder.Default
    private List<String> documentUrls = new ArrayList<>();

    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("formation")
    @lombok.Builder.Default
    private List<FormationAttendance> attendances = new ArrayList<>();


}
