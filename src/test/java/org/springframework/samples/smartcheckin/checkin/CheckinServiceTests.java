package org.springframework.samples.smartcheckin.checkin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class CheckinServiceTests {

    private static final Integer TEST_USER_ID = 1;
    private static final Integer TEST_CHECKIN_ID = 100;

    @Mock
    private CheckinRepository checkInRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SignatureStorageService signatureStorageService;

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

    @Test
    void shouldExecuteTransactionalCheckinAlternatingFromEntradaToSalida() {
        User user = createDummyUser();
        user.setIsWorking(true);
        Checkin lastEntrada = createDummyCheckin(user, CheckinType.ENTRADA);

        when(checkInRepository.findFirstByUserIdOrderByCheckInDateDesc(TEST_USER_ID)).thenReturn(Optional.of(lastEntrada));
        when(checkInRepository.save(any(Checkin.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Checkin result = checkinService.executeTransactionalCheckin(user, "dummy_sig", null);

        assertThat(result).isNotNull();
        assertThat(result.getCheckInType()).isEqualTo(CheckinType.SALIDA);
        assertThat(user.getIsWorking()).isFalse();
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    void shouldExecuteTransactionalCheckinAlternatingFromSalidaToEntrada() {
        User user = createDummyUser();
        user.setIsWorking(false);
        Checkin lastSalida = createDummyCheckin(user, CheckinType.SALIDA);

        when(checkInRepository.findFirstByUserIdOrderByCheckInDateDesc(TEST_USER_ID)).thenReturn(Optional.of(lastSalida));
        when(checkInRepository.save(any(Checkin.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Checkin result = checkinService.executeTransactionalCheckin(user, null, null);

        assertThat(result).isNotNull();
        assertThat(result.getCheckInType()).isEqualTo(CheckinType.ENTRADA);
        assertThat(user.getIsWorking()).isTrue();
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    void shouldRecordOfflineCheckinWithSealedMetadata() {
        User user = createDummyUser();
        LocalDateTime offlineTime = LocalDateTime.now().minusHours(2);
        OfflineCheckinRequest req = OfflineCheckinRequest.builder()
                .userLat(40.4168)
                .userLng(-3.7038)
                .signature("offline_signature")
                .offlineTimestamp(offlineTime)
                .qrHash("abc123hash123456")
                .checkInType(CheckinType.ENTRADA)
                .build();

        when(checkInRepository.save(any(Checkin.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Checkin result = checkinService.recordOfflineCheckin(user, req);

        assertThat(result).isNotNull();
        assertThat(result.getIsOffline()).isTrue();
        assertThat(result.getOfflineTimestamp()).isEqualTo(offlineTime);
        assertThat(result.getOfflineQrHash()).isEqualTo("abc123hash123456");
        assertThat(result.getCheckInType()).isEqualTo(CheckinType.ENTRADA);
        assertThat(user.getIsWorking()).isTrue();
    }
}