package org.springframework.samples.smartcheckin.checkin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.user.User;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class CheckinServiceTests {

    private static final Integer TEST_USER_ID = 1;
    private static final Integer TEST_CHECKIN_ID = 100;

    @Mock
    private CheckinRepository checkInRepository;

    @InjectMocks
    private CheckinService checkinService;

    private User createDummyUser() {
        User user = new User();
        user.setId(TEST_USER_ID);
        user.setUsername("testuser");
        user.setIsWorking(false);
        return user;
    }

    private Checkin createDummyCheckin(User user, CheckinType type) {
        Checkin checkin = new Checkin();
        checkin.setId(TEST_CHECKIN_ID);
        checkin.setCheckInType(type);
        checkin.setUser(user);
        return checkin;
    }

    @ParameterizedTest
    @EnumSource(CheckinType.class)
    void shouldPerformCheckIn(CheckinType type) {
        User user = createDummyUser();
        Checkin dummyCheckin = createDummyCheckin(user, type);

        when(checkInRepository.save(any(Checkin.class))).thenReturn(dummyCheckin);

        Checkin result = checkinService.performCheckIn(user, type);

        assertThat(result).isNotNull();
        assertThat(result.getCheckInType()).isEqualTo(type);
        assertThat(result.getUser()).isEqualTo(user);

        verify(checkInRepository).save(any(Checkin.class));
    }

    @Test
    void shouldFindCheckinsByUserId() {
        User user = createDummyUser();
        Checkin checkin = createDummyCheckin(user, CheckinType.ENTRADA);
        when(checkInRepository.findByUserIdOrderByCheckInDateDesc(TEST_USER_ID)).thenReturn(List.of(checkin));

        List<Checkin> results = checkinService.findByUserId(TEST_USER_ID);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(TEST_CHECKIN_ID);

        verify(checkInRepository).findByUserIdOrderByCheckInDateDesc(TEST_USER_ID);
    }

    @Test
    void shouldSaveCheckin() {
        User user = createDummyUser();
        Checkin checkin = createDummyCheckin(user, CheckinType.SALIDA);
        when(checkInRepository.save(checkin)).thenReturn(checkin);

        Checkin result = checkinService.save(checkin);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(TEST_CHECKIN_ID);
        verify(checkInRepository).save(checkin);
    }

    @Test
    void shouldDeleteAllCheckinsForUser() {
        User user = createDummyUser();
        Checkin checkin = createDummyCheckin(user, CheckinType.ENTRADA);
        when(checkInRepository.findByUserId(TEST_USER_ID)).thenReturn(List.of(checkin));

        checkinService.deleteAllCheckins(user);

        verify(checkInRepository).findByUserId(TEST_USER_ID);
        verify(checkInRepository).deleteAll(List.of(checkin));
    }
}