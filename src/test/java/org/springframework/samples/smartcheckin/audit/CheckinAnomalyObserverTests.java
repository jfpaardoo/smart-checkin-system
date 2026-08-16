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

@ExtendWith(MockitoExtension.class)
class CheckinAnomalyObserverTests {

    @Mock
    private AuditService auditService;

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
    void testOnCheckinEventWhenSourceNotCheckinService() {
        Object otherSource = new Object();
        CheckinEvent event = new CheckinEvent(otherSource);

        observer.onCheckinEvent(event);

        verifyNoInteractions(checkinRepository, auditService, emailNotificationSender);
    }

    @Test
    void testOnCheckinEventWhenCountBelowThreshold() {
        CheckinEvent event = new CheckinEvent(checkinService);
        when(checkinRepository.count()).thenReturn(500L);

        observer.onCheckinEvent(event);

        verify(checkinRepository).count();
        verifyNoInteractions(auditService, emailNotificationSender);
    }

    @Test
    void testOnCheckinEventWhenCountAboveThreshold() {
        CheckinEvent event = new CheckinEvent(checkinService);
        when(checkinRepository.count()).thenReturn(10001L);

        observer.onCheckinEvent(event);

        verify(checkinRepository).count();
        verify(auditService).recordAuditLog(any(AuditLog.class));
        verify(emailNotificationSender).send(eq("admin@smartcheckin.com"), anyString(), anyString());
    }

    @Test
    void testOnCheckinEventWhenRepositoryThrowsException() {
        CheckinEvent event = new CheckinEvent(checkinService);
        when(checkinRepository.count()).thenThrow(new RuntimeException("DB offline"));

        observer.onCheckinEvent(event);

        verify(checkinRepository).count();
        verifyNoInteractions(auditService, emailNotificationSender);
    }
}