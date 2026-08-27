package org.springframework.samples.smartcheckin.formation;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FormationPublishRequest {
    private Boolean notifyAll = true;
    private List<Integer> targetUserIds;
}
