package org.springframework.samples.smartcheckin.formation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class FormationServiceTests {

    @Mock
    private FormationRepository formationRepository;

    @Mock
    private FormationAttendanceRepository attendanceRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private FormationService formationService;

    private Formation formation;
    private User user;

    @BeforeEach
    void setup() {
        formation = new Formation();
        formation.setId(1);
        formation.setName("Spring Boot Security");
        formation.setFormationDate(LocalDateTime.now(ZoneId.systemDefault()));
        formation.setAttendances(new ArrayList<>());

        user = new User();
        user.setId(10);
        user.setPersonalCode("1234");
        user.setUsername("testuser");
    }

    @Test
    void shouldRegisterAttendance() {
        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(userService.findByPersonalCode("1234")).thenReturn(user);
        when(attendanceRepository.findByFormationAndUser(formation, user)).thenReturn(Optional.empty());

        formationService.registerAttendance(1, "1234");

        verify(attendanceRepository, times(1)).save(any(FormationAttendance.class));
    }

    @Test
    void shouldNotRegisterAttendanceIfUserNotFound() {
        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(userService.findByPersonalCode("9999")).thenThrow(new ResourceNotFoundException("User", "personalCode", "9999"));

        assertThrows(ResourceNotFoundException.class, () -> formationService.registerAttendance(1, "9999"));
        verify(formationRepository, never()).save(any());
    }

    @Test
    void shouldNotRegisterAttendanceIfFormationNotFound() {
        when(formationRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> formationService.registerAttendance(99, "1234"));
        verify(formationRepository, never()).save(any());
    }
}
