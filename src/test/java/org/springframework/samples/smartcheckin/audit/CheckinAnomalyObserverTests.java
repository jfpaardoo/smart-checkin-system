package org.springframework.samples.smartcheckin.audit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.checkin.CheckinService;
import org.springframework.samples.smartcheckin.notifications.EmailNotificationSender;
import org.springframework.samples.smartcheckin.statistics.events.CheckinEvent;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class CheckinAnomalyObserverTests {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private CheckinRepository checkinRepository;

    @Mock
    private EmailNotificationSender emailNotificationSender;

    @InjectMocks
    private CheckinAnomalyObserver observer;

    private CheckinService checkinService;

    @BeforeEach
    void setUp() {
        checkinService = mock(CheckinService.class);
    }

    @Test
    void onCheckinEvent_eventSourceNotCheckinService_doesNothing() {
        Object otherSource = new Object();
        CheckinEvent event = new CheckinEvent(otherSource);

        observer.onCheckinEvent(event);

        verifyNoInteractions(checkinRepository, auditLogRepository, emailNotificationSender);
    }

    @Test
    void onCheckinEvent_countBelowThreshold_doesNotLogAnomaly() {
        CheckinEvent event = new CheckinEvent(checkinService);
        when(checkinRepository.count()).thenReturn(500L);

        observer.onCheckinEvent(event);

        verify(checkinRepository).count();
        verifyNoInteractions(auditLogRepository, emailNotificationSender);
    }

    @Test
    void onCheckinEvent_countAboveThreshold_logsAnomalyAndSendsNotification() {
        CheckinEvent event = new CheckinEvent(checkinService);
        when(checkinRepository.count()).thenReturn(10001L);

        observer.onCheckinEvent(event);

        verify(checkinRepository).count();
        verify(auditLogRepository).save(any(AuditLog.class));
        verify(emailNotificationSender).send(eq("admin@smartcheckin.com"), anyString(), anyString());
    }

    @Test
    void onCheckinEvent_repositoryThrowsException_logsErrorWithoutCrashing() {
        CheckinEvent event = new CheckinEvent(checkinService);
        when(checkinRepository.count()).thenThrow(new RuntimeException("DB offline"));

        observer.onCheckinEvent(event);

        verify(checkinRepository).count();
        verifyNoInteractions(auditLogRepository, emailNotificationSender);
    }
}
