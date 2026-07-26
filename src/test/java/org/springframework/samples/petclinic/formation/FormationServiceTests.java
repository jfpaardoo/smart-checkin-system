package org.springframework.samples.petclinic.formation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.springframework.samples.petclinic.exceptions.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.petclinic.user.User;
import org.springframework.samples.petclinic.user.UserService;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class FormationServiceTests {

    @Mock
    private FormationRepository formationRepository;

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
        formation.setFormationDate(LocalDateTime.now());
        formation.setAttendees(new ArrayList<>());

        user = new User();
        user.setId(10);
        user.setPersonalCode("1234");
        user.setUsername("testuser");
    }

    @Test
    void shouldRegisterAttendance() {
        when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
        when(userService.findByPersonalCode("1234")).thenReturn(user);

        formationService.registerAttendance(1, "1234");

        assertTrue(formation.getAttendees().contains(user));
        verify(formationRepository, times(1)).save(formation);
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
