package org.springframework.samples.smartcheckin.analytics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
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
    private final CheckinRepository checkinRepository;

    @Autowired
    public AnalyticsRestController(StatisticsRepository statisticsRepository, AnalyticsService analyticsService, CheckinRepository checkinRepository) {
        this.statisticsRepository = statisticsRepository;
        this.analyticsService = analyticsService;
        this.checkinRepository = checkinRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<PlatformStatistic>> getAnalytics() {
        List<PlatformStatistic> stats = new ArrayList<>(statisticsRepository.findLast30Days());
        
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        Long liveTotalCheckins = checkinRepository.count();
        
        Optional<PlatformStatistic> todayStat = stats.stream().filter(s -> s.getDate().equals(today)).findFirst();
        if (todayStat.isPresent()) {
            todayStat.get().setTotalCheckins(liveTotalCheckins);
        } else {
            PlatformStatistic stat = new PlatformStatistic();
            stat.setDate(today);
            stat.setTotalCheckins(liveTotalCheckins);
            
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
