package org.springframework.samples.smartcheckin.statistics.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.statistics.PlatformStatistic;
import org.springframework.samples.smartcheckin.statistics.StatisticsRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
public class StatisticsObserver {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsObserver.class);

    private final StatisticsRepository statisticsRepository;
    private final FormationRepository formationRepository;
    private final FormationAttendanceRepository attendanceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public StatisticsObserver(StatisticsRepository statisticsRepository,
                              FormationRepository formationRepository,
                              FormationAttendanceRepository attendanceRepository,
                              SimpMessagingTemplate messagingTemplate) {
        this.statisticsRepository = statisticsRepository;
        this.formationRepository = formationRepository;
        this.attendanceRepository = attendanceRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    @Transactional
    public void handleCheckinEvent(CheckinEvent event) {
        logger.info("CheckinEvent received. Updating statistics...");
        updateTodayStatistic();
    }

    @EventListener
    @Transactional
    public void handleFormationAttendanceEvent(FormationAttendanceEvent event) {
        logger.info("FormationAttendanceEvent received. Updating statistics...");
        updateTodayStatistic();
    }

    private void updateTodayStatistic() {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        PlatformStatistic stat = statisticsRepository.findFirstByDate(today)
                .orElse(new PlatformStatistic());
        
        stat.setDate(today);

        // Update total checkins (Asistencias a formaciones del día)
        Long totalCheckins = attendanceRepository.countByCheckInDateBetween(today.atStartOfDay(), today.atTime(23, 59, 59));
        stat.setTotalCheckins(totalCheckins != null ? totalCheckins : 0L);
        
        // Update active formations
        Long activeFormations = formationRepository.countByFormationDateAfter(LocalDateTime.now(ZoneId.systemDefault()));
        stat.setActiveFormations(activeFormations != null ? activeFormations : 0L);
        
        // Update formation attendance rate
        Double attendanceRate = calculateAttendanceRate();
        stat.setFormationAttendanceRate(Math.round(attendanceRate * 100.0) / 100.0);
        
        // Average hours per employee (if needed in the future)
        if (stat.getAverageHoursPerEmployee() == null) {
            stat.setAverageHoursPerEmployee(0.0);
        }

        statisticsRepository.save(stat);
        
        // Emitir los nuevos datos por WebSocket para refresco en tiempo real
        messagingTemplate.convertAndSend("/topic/statistics", stat);
        
        logger.info("Statistics updated successfully for {}", today);
    }

    private Double calculateAttendanceRate() {
        try {
            long totalAssigned = attendanceRepository.count();
            if (totalAssigned > 0) {
                long totalAttended = 0;
                for (FormationAttendance att : attendanceRepository.findAll()) {
                    if (att.getCheckInDate() != null) {
                        totalAttended++;
                    }
                }
                
                double attendanceRate = ((double) totalAttended / totalAssigned) * 100.0;
                logger.info("calculateAttendanceRate: totalAttended={}, totalAssigned={}, rate={}", totalAttended, totalAssigned, attendanceRate);
                return attendanceRate > 100.0 ? 100.0 : attendanceRate;
            }
        } catch (Exception e) {
            logger.warn("Could not compute attendance rate: {}", e.getMessage());
        }
        return 0.0;
    }
}
