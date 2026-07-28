package org.springframework.samples.smartcheckin.analytics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.statistics.PlatformStatistic;
import org.springframework.samples.smartcheckin.statistics.StatisticsRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsRestController {

    private final StatisticsRepository statisticsRepository;
    private final AnalyticsService analyticsService;

    @Autowired
    public AnalyticsRestController(StatisticsRepository statisticsRepository, AnalyticsService analyticsService) {
        this.statisticsRepository = statisticsRepository;
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<PlatformStatistic>> getAnalytics() {
        return ResponseEntity.ok(statisticsRepository.findLast30Days());
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserAnalyticsDTO>> getAllUsersAnalytics(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(analyticsService.getAllUsersAnalytics(search));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserAnalyticsDTO> getUserAnalytics(@PathVariable Integer userId) {
        return analyticsService.getUserAnalytics(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
