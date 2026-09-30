package org.springframework.samples.smartcheckin.checkin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.notification.NotificationContext;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AutoCheckoutScheduledServiceTests {

    @Mock
    private CheckinRepository checkinRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationContext notificationContext;

    private AutoCheckoutScheduledService scheduledService;

    @BeforeEach
    void setUp() {
        scheduledService = new AutoCheckoutScheduledService(checkinRepository, userRepository, notificationContext);
        ReflectionTestUtils.setField(scheduledService, "staleHours", 12);
        ReflectionTestUtils.setField(scheduledService, "defaultShiftHours", 8);
    }

    @Test
    void testProcessAutoCheckoutsWhenNoStaleCheckins() {
        when(checkinRepository.findStaleOpenCheckins(any(LocalDateTime.class))).thenReturn(Collections.emptyList());

        int processed = scheduledService.processAutoCheckouts();

        assertEquals(0, processed);
        verify(checkinRepository, never()).save(any(Checkin.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testProcessAutoCheckoutsWithStaleCheckin() {
        User user = new User();
        user.setId(42);
        user.setUsername("forgotten_employee");
        user.setIsWorking(true);

        Checkin entryCheckin = Checkin.builder()
                .checkInDate(LocalDateTime.now().minusHours(14))
                .checkInType(CheckinType.ENTRADA)
                .user(user)
                .build();

        when(checkinRepository.findStaleOpenCheckins(any(LocalDateTime.class))).thenReturn(List.of(entryCheckin));

        int processed = scheduledService.processAutoCheckouts();

        assertEquals(1, processed);
        verify(checkinRepository).save(argThat(c ->
                c.getCheckInType() == CheckinType.SALIDA
                        && Boolean.TRUE.equals(c.getIsAutoCheckout())
                        && Boolean.FALSE.equals(c.getIsRectified())
                        && c.getUser().equals(user)
        ));
        verify(userRepository).save(argThat(u -> Boolean.FALSE.equals(u.getIsWorking())));
        verify(notificationContext).sendNotification(eq(user), anyString(), anyString());
    }

    @Test
    void testProcessAutoCheckoutsIgnoresUserAlreadyNotWorking() {
        User user = new User();
        user.setId(42);
        user.setUsername("already_closed");
        user.setIsWorking(false);

        Checkin entryCheckin = Checkin.builder()
                .checkInDate(LocalDateTime.now().minusHours(15))
                .checkInType(CheckinType.ENTRADA)
                .user(user)
                .build();

        when(checkinRepository.findStaleOpenCheckins(any(LocalDateTime.class))).thenReturn(List.of(entryCheckin));

        int processed = scheduledService.processAutoCheckouts();

        assertEquals(0, processed);
        verify(checkinRepository, never()).save(any(Checkin.class));
    }

    @Test
    void testRunAutoCheckoutTaskTriggersProcessing() {
        when(checkinRepository.findStaleOpenCheckins(any(LocalDateTime.class))).thenReturn(Collections.emptyList());

        scheduledService.runAutoCheckoutTask();

        verify(checkinRepository).findStaleOpenCheckins(any(LocalDateTime.class));
    }
}
