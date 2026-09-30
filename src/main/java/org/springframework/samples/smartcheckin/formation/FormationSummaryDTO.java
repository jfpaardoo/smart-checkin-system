package org.springframework.samples.smartcheckin.formation;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormationSummaryDTO {

    private Integer id;
    private String name;
    private String description;
    private LocalDateTime formationDate;
    private FormationStatus status;
    private String location;
    private String trainer;
    private Boolean isClosed;
    private int attendanceCount;
    private int documentCount;

    public static FormationSummaryDTO fromEntity(Formation formation) {
        if (formation == null) {
            return null;
        }
        return FormationSummaryDTO.builder()
                .id(formation.getId())
                .name(formation.getName())
                .description(formation.getDescription())
                .formationDate(formation.getFormationDate())
                .status(formation.getStatus())
                .location(formation.getLocation())
                .trainer(formation.getTrainer())
                .isClosed(formation.getIsClosed())
                .attendanceCount(formation.getAttendances() != null ? formation.getAttendances().size() : 0)
                .documentCount(formation.getDocumentUrls() != null ? formation.getDocumentUrls().size() : 0)
                .build();
    }
}
