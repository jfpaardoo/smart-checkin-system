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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

import jakarta.persistence.Index;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;

@Getter
@Setter
@org.jpatterns.gof.BuilderPattern.Builder
@lombok.Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
@EqualsAndHashCode(callSuper = false, exclude = {"attendances"})
@Entity
@Table(name = "formations", indexes = {
    @Index(name = "idx_formations_status", columnList = "status"),
    @Index(name = "idx_formations_date", columnList = "formationDate"),
    @Index(name = "idx_formations_status_date", columnList = "status, formationDate")
})
public class Formation extends BaseEntity {

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 255)
    private String description;

    @NotNull
    private LocalDateTime formationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @lombok.Builder.Default
    private FormationStatus status = FormationStatus.DRAFT;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "formation_documents", joinColumns = @JoinColumn(name = "formation_id"))
    @Column(name = "document_url", length = 1000)
    @lombok.Builder.Default
    private List<String> documentUrls = new ArrayList<>();

    @OneToMany(mappedBy = "formation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("formation")
    @lombok.Builder.Default
    private List<FormationAttendance> attendances = new ArrayList<>();

    @NotBlank
    @Size(max = 255)
    @Column(name = "location", length = 255)
    @lombok.Builder.Default
    private String location = "BA VILLAFRANCA";

    @NotBlank
    @Size(max = 255)
    @Column(name = "trainer", length = 255)
    @lombok.Builder.Default
    private String trainer = "VICTOR PARDO";

    @Column(name = "is_closed")
    @lombok.Builder.Default
    private Boolean isClosed = false;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "trainer_signature", columnDefinition = "TEXT")
    private String trainerSignature;

    @Column(name = "closed_date")
    private LocalDateTime closedDate;

    public boolean isDraft() {
        return FormationStatus.DRAFT.equals(this.status);
    }

    public boolean isPublished() {
        return FormationStatus.PUBLISHED.equals(this.status);
    }

    public boolean isClosedSession() {
        return Boolean.TRUE.equals(this.isClosed) || FormationStatus.CLOSED.equals(this.status);
    }

}
