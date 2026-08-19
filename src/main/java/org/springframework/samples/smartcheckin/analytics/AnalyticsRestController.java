package org.springframework.samples.smartcheckin.analytics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.statistics.PlatformStatistic;
import org.springframework.samples.smartcheckin.statistics.StatisticsRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
    public ResponseEntity<List<PlatformStatistic>> getAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        List<PlatformStatistic> stats;
        
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            stats = new ArrayList<>(statisticsRepository.findByDateBetweenOrderByDateAsc(start, end));
        } else {
            stats = new ArrayList<>(statisticsRepository.findLast30Days());
            // findLast30Days returns descending, so reverse it for chronological order if needed, but frontend reverses it.
        }
        
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        
        Optional<PlatformStatistic> todayStat = stats.stream().filter(s -> s.getDate().equals(today)).findFirst();
        if (!todayStat.isPresent()) {
            PlatformStatistic stat = new PlatformStatistic();
            stat.setDate(today);
            stat.setTotalCheckins(0L);
            
            if (!stats.isEmpty()) {
                PlatformStatistic last = stats.get(0);
                stat.setActiveFormations(last.getActiveFormations());
                stat.setAverageHoursPerEmployee(last.getAverageHoursPerEmployee());
                stat.setFormationAttendanceRate(last.getFormationAttendanceRate());
            } else {
                stat.setActiveFormations(0L);
                stat.setAverageHoursPerEmployee(0.0);
                stat.setFormationAttendanceRate(100.0);
            }
            
            stats.add(0, stat);
            
            if (stats.size() > 30) {
                stats.remove(stats.size() - 1);
            }
        }
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserAnalyticsDTO>> getAllUsersAnalytics(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer companyId) {
        return ResponseEntity.ok(analyticsService.getAllUsersAnalytics(search, companyId));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserAnalyticsDTO> getUserAnalytics(@PathVariable Integer userId) {
        return analyticsService.getUserAnalytics(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/formations")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<FormationAnalyticsDTO>> getFormationAnalytics() {
        return ResponseEntity.ok(analyticsService.getFormationAnalytics());
    }
}
