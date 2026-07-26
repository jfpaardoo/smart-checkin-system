package org.springframework.samples.smartcheckin.analytics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.statistics.PlatformStatistic;
import org.springframework.samples.smartcheckin.statistics.StatisticsRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsRestController {

    private final StatisticsRepository statisticsRepository;

    @Autowired
    public AnalyticsRestController(StatisticsRepository statisticsRepository) {
        this.statisticsRepository = statisticsRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<PlatformStatistic>> getAnalytics() {
        return ResponseEntity.ok(statisticsRepository.findLast30Days());
    }
}
