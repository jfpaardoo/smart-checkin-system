package org.springframework.samples.smartcheckin.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAnalyticsDTO {
    private Integer userId;
    private String username;
    private String firstName;
    private String lastName;
    private String personalCode;
    private String authority;
    private Boolean isWorking;
    private Integer totalCheckins;
    private Long totalWorkMinutes;
    private Integer formationsAssigned;
    private Integer formationsAttended;
    private Integer formationsCompleted;
    private Double attendancePercentage;
    private Long totalFormationMinutes;
    private List<UserFormationDetailDTO> formationDetails;
}
