package org.springframework.samples.smartcheckin.checkin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CheckinServiceTests {

    private static final Integer TEST_USER_ID = 1;
    private static final Integer TEST_CHECKIN_ID = 100;

    @Mock
    private CheckinRepository checkInRepository;

    @Mock
    private UserService userService;

    // 4. SUT Real (Sin Anotaciones)
    private CheckinService checkinService;

    @BeforeEach
    void setUp() {
        // 5. Instanciación Manual (Setup)
        checkinService = new CheckinService(checkInRepository);
    }

    // Helper method for DAMP
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
    @EnumSource(CheckinType.class) // Probar ENTRADA y SALIDA
    void shouldPerformCheckIn(CheckinType type) {
        User user = createDummyUser();
        Checkin dummyCheckin = createDummyCheckin(user, type);

        when(checkInRepository.save(any(Checkin.class))).thenReturn(dummyCheckin);

        // Execute SUT
        Checkin result = checkinService.performCheckIn(user, type);

        // Fluent Assertions
        assertThat(result).isNotNull();
        assertThat(result.getCheckInType()).isEqualTo(type);
        assertThat(result.getUser()).isEqualTo(user);

        // Verificación Estricta
        verify(checkInRepository).save(any(Checkin.class));
    }

    @Test
    void shouldThrowExceptionWhenUserIsNull() {
        // Ejecución y verificación de excepción usando assertThrows
        assertThrows(NullPointerException.class, () -> {
            checkinService.performCheckIn(null, CheckinType.ENTRADA);
        });

        // Asegurarse de que no ocurre ningún efecto secundario en caso de error
        verify(checkInRepository, never()).save(any(Checkin.class));
        verify(userService, never()).saveUser(any(User.class));
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
}
