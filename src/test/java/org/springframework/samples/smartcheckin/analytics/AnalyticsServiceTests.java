package org.springframework.samples.smartcheckin.analytics;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;

class AnalyticsServiceTests {

	private UserRepository userRepository;
	private CheckinRepository checkinRepository;
	private FormationAttendanceRepository attendanceRepository;
	private AnalyticsService analyticsService;

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		checkinRepository = mock(CheckinRepository.class);
		attendanceRepository = mock(FormationAttendanceRepository.class);
		analyticsService = new AnalyticsService(userRepository, checkinRepository, attendanceRepository);
	}

	@Test
	void testGetAllUsersAnalytics() {
		User user1 = new User();
		user1.setId(1);
		user1.setUsername("user1");
		user1.setFirstName("John");
		user1.setLastName("Doe");
		user1.setPersonalCode("1234");
		Authorities auth = new Authorities();
		auth.setAuthority("USER");
		user1.setAuthority(auth);

		when(userRepository.findAll()).thenReturn(List.of(user1));
		
		Checkin checkin1 = new Checkin();
		checkin1.setCheckInType(CheckinType.ENTRADA);
		checkin1.setCheckInDate(LocalDateTime.of(2026, 8, 1, 9, 0));
		
		Checkin checkin2 = new Checkin();
		checkin2.setCheckInType(CheckinType.SALIDA);
		checkin2.setCheckInDate(LocalDateTime.of(2026, 8, 1, 17, 0));
		
		when(checkinRepository.findByUserIdOrderByCheckInDateDesc(1)).thenReturn(List.of(checkin2, checkin1));

		Formation formation = new Formation();
		formation.setId(10);
		formation.setName("Course");
		formation.setFormationDate(LocalDateTime.of(2026, 8, 1, 10, 0));

		FormationAttendance att = new FormationAttendance();
		att.setFormation(formation);
		att.setCheckInDate(LocalDateTime.of(2026, 8, 1, 10, 0));
		att.setCheckOutDate(LocalDateTime.of(2026, 8, 1, 12, 0));
		att.setSignature("signature");

		when(attendanceRepository.findByUserId(1)).thenReturn(List.of(att));

		List<UserAnalyticsDTO> res = analyticsService.getAllUsersAnalytics("John");
		assertFalse(res.isEmpty());
		UserAnalyticsDTO dto = res.getFirst();
		assertEquals("John", dto.getFirstName());
		assertEquals(480L, dto.getTotalWorkMinutes());
		assertEquals(1, dto.getFormationsAssigned());
		assertEquals(100.0, dto.getAttendancePercentage());
		assertEquals(120L, dto.getTotalFormationMinutes());
	}

	@Test
	void testGetUserAnalyticsDetail() {
		User user1 = new User();
		user1.setId(1);
		user1.setUsername("user1");
		user1.setFirstName("John");
		user1.setLastName("Doe");
		user1.setPersonalCode("1234");
		
		when(userRepository.findById(1)).thenReturn(Optional.of(user1));
		
		Formation formation = new Formation();
		formation.setId(10);
		formation.setName("Course");
		
		FormationAttendance att = new FormationAttendance();
		att.setFormation(formation);
		att.setCheckInDate(LocalDateTime.of(2026, 8, 1, 10, 0));
		att.setCheckOutDate(LocalDateTime.of(2026, 8, 1, 12, 0));
		att.setSignature("signature");
		
		when(attendanceRepository.findByUserId(1)).thenReturn(List.of(att));
		
		Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
		assertTrue(res.isPresent());
		assertEquals("John", res.get().getFirstName());
		assertFalse(res.get().getFormationDetails().isEmpty());
		assertEquals("COMPLETED", res.get().getFormationDetails().getFirst().getStatus());
	}

	@Test
	void testGetAllUsersAnalyticsSearchFilters() {
		User u1 = new User();
		u1.setId(1);
		u1.setFirstName("Alice");
		u1.setLastName("Smith");
		u1.setUsername("asmith");
		u1.setPersonalCode("1111");

		User u2 = new User();
		u2.setId(2);
		u2.setFirstName("Bob");
		u2.setLastName("Jones");
		u2.setUsername("bjones");
		u2.setPersonalCode("2222");

		when(userRepository.findAll()).thenReturn(List.of(u1, u2));

		assertEquals(1, analyticsService.getAllUsersAnalytics("asmith").size());
		assertEquals(1, analyticsService.getAllUsersAnalytics("Smith").size());
		assertEquals(1, analyticsService.getAllUsersAnalytics("2222").size());
		assertEquals(0, analyticsService.getAllUsersAnalytics("nonexistent").size());
	}

	@Test
	void testFormationAttendanceStatuses() {
		User user = new User();
		user.setId(1);
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		Formation f1 = new Formation();
		f1.setId(10);
		f1.setName("In Progress");

		FormationAttendance attInProgress = new FormationAttendance();
		attInProgress.setFormation(f1);
		attInProgress.setCheckInDate(LocalDateTime.now());

		Formation f2 = new Formation();
		f2.setId(11);
		f2.setName("Not Attended");

		FormationAttendance attNotAttended = new FormationAttendance();
		attNotAttended.setFormation(f2);

		when(attendanceRepository.findByUserId(1)).thenReturn(List.of(attInProgress, attNotAttended));

		Optional<UserAnalyticsDTO> res = analyticsService.getUserAnalytics(1);
		assertTrue(res.isPresent());
		assertEquals(2, res.get().getFormationDetails().size());
	}
}
