package org.springframework.samples.smartcheckin.analytics;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FormationAnalyticsDTO {
    private Integer formationId;
    private String formationName;
    private LocalDateTime formationDate;
    private Integer totalExpected;
    private Integer totalAttended;
    private Double attendancePercentage;
}
