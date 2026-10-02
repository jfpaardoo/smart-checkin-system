package org.springframework.samples.smartcheckin.audit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataRetentionSchedulerTests {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private CheckinRepository checkinRepository;

    @Mock
    private FormationAttendanceRepository formationAttendanceRepository;

    private DataRetentionScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DataRetentionScheduler(auditLogRepository, checkinRepository, formationAttendanceRepository);
    }

    @Test
    void testPerformDataRetentionCleanupDeletesOldRecords() {
        scheduler.performDataRetentionCleanup();

        verify(auditLogRepository, times(1)).deleteByTimestampBefore(any(LocalDateTime.class));
        verify(checkinRepository, times(1)).deleteByCheckInDateBefore(any(LocalDateTime.class));
        verify(formationAttendanceRepository, times(1)).deleteByCheckInDateBefore(any(LocalDateTime.class));
    }

    @Test
    void testPerformDataRetentionCleanupHandlesExceptionsGracefully() {
        doThrow(new RuntimeException("DB error")).when(auditLogRepository).deleteByTimestampBefore(any(LocalDateTime.class));
        doThrow(new RuntimeException("DB error")).when(checkinRepository).deleteByCheckInDateBefore(any(LocalDateTime.class));

        scheduler.performDataRetentionCleanup();

        verify(auditLogRepository, times(1)).deleteByTimestampBefore(any(LocalDateTime.class));
        verify(checkinRepository, times(1)).deleteByCheckInDateBefore(any(LocalDateTime.class));
    }
}
