package org.springframework.samples.smartcheckin.checkin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
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
        LocalDateTime offlineTime = LocalDateTime.now(ZoneId.systemDefault()).minusHours(2);
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

    @Test
    void shouldThrowWhenBatchExceedsFiftyItems() {
        User user = createDummyUser();
        List<OfflineCheckinRequest> requests = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            requests.add(OfflineCheckinRequest.builder()
                    .offlineTimestamp(LocalDateTime.now(ZoneId.systemDefault()))
                    .qrHash("hash_offline_test_" + i)
                    .checkInType(CheckinType.ENTRADA)
                    .build());
        }

        assertThatThrownBy(() -> checkinService.processOfflineBatch(user, requests))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no puede superar 50 registros por sincronización");
    }

    @Test
    void shouldSortBatchChronologicallyByOfflineTimestamp() {
        User user = createDummyUser();
        LocalDateTime t1 = LocalDateTime.now(ZoneId.systemDefault()).minusHours(4);
        LocalDateTime t2 = LocalDateTime.now(ZoneId.systemDefault()).minusHours(2);

        OfflineCheckinRequest reqSalida = OfflineCheckinRequest.builder()
                .offlineTimestamp(t2)
                .qrHash("hash_t2_1234567890")
                .checkInType(CheckinType.SALIDA)
                .build();

        OfflineCheckinRequest reqEntrada = OfflineCheckinRequest.builder()
                .offlineTimestamp(t1)
                .qrHash("hash_t1_1234567890")
                .checkInType(CheckinType.ENTRADA)
                .build();

        // Pass unsorted (reqSalida first, reqEntrada second)
        List<OfflineCheckinRequest> requests = List.of(reqSalida, reqEntrada);

        when(checkInRepository.existsByOfflineQrHashAndUserId("hash_t1_1234567890", user.getId())).thenReturn(false);
        when(checkInRepository.existsByOfflineQrHashAndUserId("hash_t2_1234567890", user.getId())).thenReturn(false);
        when(checkInRepository.save(any(Checkin.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<CheckinResponseDTO> results = checkinService.processOfflineBatch(user, requests);

        assertThat(results).hasSize(2);
        // Should have been processed in order: reqEntrada (t1) first, reqSalida (t2) second
        assertThat(results.get(0).getCheckInType()).isEqualTo(CheckinType.ENTRADA);
        assertThat(results.get(1).getCheckInType()).isEqualTo(CheckinType.SALIDA);
    }

    @Test
    void shouldRejectSignatureExceedingMaxSize() {
        User user = createDummyUser();
        String massiveSignature = "data:image/png;base64," + "A".repeat(500_001);

        OfflineCheckinRequest req = OfflineCheckinRequest.builder()
                .offlineTimestamp(LocalDateTime.now(ZoneId.systemDefault()))
                .qrHash("hash_big_sig_12345")
                .signature(massiveSignature)
                .checkInType(CheckinType.ENTRADA)
                .build();

        List<OfflineCheckinRequest> requests = List.of(req);

        assertThatThrownBy(() -> checkinService.processOfflineBatch(user, requests))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("La firma digital excede el tamaño máximo permitido");
    }

    @Test
    void shouldRejectQrHashExceedingMaxLength() {
        User user = createDummyUser();
        String massiveHash = "H".repeat(256);

        OfflineCheckinRequest req = OfflineCheckinRequest.builder()
                .offlineTimestamp(LocalDateTime.now(ZoneId.systemDefault()))
                .qrHash(massiveHash)
                .checkInType(CheckinType.ENTRADA)
                .build();

        List<OfflineCheckinRequest> requests = List.of(req);

        assertThatThrownBy(() -> checkinService.processOfflineBatch(user, requests))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("El hash del código QR offline excede la longitud máxima permitida");
    }

    @Test
    void shouldRejectDuplicateQrHashForSameUser() {
        User user = createDummyUser();
        String qrHash = "reused_qr_hash_12345";

        OfflineCheckinRequest req = OfflineCheckinRequest.builder()
                .offlineTimestamp(LocalDateTime.now(ZoneId.systemDefault()))
                .qrHash(qrHash)
                .checkInType(CheckinType.ENTRADA)
                .build();

        when(checkInRepository.existsByOfflineQrHashAndUserId(qrHash, user.getId())).thenReturn(true);

        List<OfflineCheckinRequest> requests = List.of(req);

        assertThatThrownBy(() -> checkinService.processOfflineBatch(user, requests))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("El código QR offline ya ha sido utilizado para este usuario");
    }
}