package org.springframework.samples.smartcheckin.statistics;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.statistics.events.CheckinEvent;
import org.springframework.samples.smartcheckin.statistics.events.FormationAttendanceEvent;
import org.springframework.samples.smartcheckin.statistics.events.StatisticsObserver;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class StatisticsObserverTests {

    @Mock
    private StatisticsRepository statisticsRepository;

    @Mock
    private CheckinRepository checkinRepository;

    @Mock
    private FormationRepository formationRepository;

    @Mock
    private FormationAttendanceRepository attendanceRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private StatisticsObserver statisticsObserver;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testHandleCheckinEventUpdatesStatistics() {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        PlatformStatistic stat = new PlatformStatistic();
        stat.setDate(today);

        when(statisticsRepository.findFirstByDate(today)).thenReturn(Optional.of(stat));
        when(attendanceRepository.countByCheckInDateBetween(any(), any())).thenReturn(5L);
        when(formationRepository.countByFormationDateAfter(any())).thenReturn(2L);
        when(attendanceRepository.count()).thenReturn(10L);
        List<FormationAttendance> list1 = new ArrayList<>();
        for(int i=0; i<10; i++) {
            FormationAttendance a = new FormationAttendance();
            if(i < 8) a.setCheckInDate(LocalDateTime.now());
            list1.add(a);
        }
        when(attendanceRepository.findAll()).thenReturn(list1);

        statisticsObserver.handleCheckinEvent(new CheckinEvent(this));

        verify(statisticsRepository, times(1)).save(argThat(s -> 
            s.getTotalCheckins().equals(5L) && 
            s.getActiveFormations().equals(2L) &&
            s.getFormationAttendanceRate().equals(80.0)
        ));
    }

    @Test
    void testHandleFormationAttendanceEventUpdatesStatistics() {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        
        when(statisticsRepository.findFirstByDate(today)).thenReturn(Optional.empty());
        when(attendanceRepository.countByCheckInDateBetween(any(), any())).thenReturn(10L);
        when(formationRepository.countByFormationDateAfter(any())).thenReturn(0L);
        when(attendanceRepository.count()).thenReturn(10L); // 100% attendance
        List<FormationAttendance> list2 = new ArrayList<>();
        for(int i=0; i<10; i++) {
            FormationAttendance a = new FormationAttendance();
            a.setCheckInDate(LocalDateTime.now());
            list2.add(a);
        }
        when(attendanceRepository.findAll()).thenReturn(list2);

        statisticsObserver.handleFormationAttendanceEvent(new FormationAttendanceEvent(this));

        verify(statisticsRepository, times(1)).save(argThat(s -> 
            s.getTotalCheckins().equals(10L) && 
            s.getActiveFormations().equals(0L) &&
            s.getFormationAttendanceRate().equals(100.0) &&
            s.getDate().equals(today)
        ));
    }
}
