package org.springframework.samples.smartcheckin.exports;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = ExportRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class ExportRestControllerTests {

	private static final String BASE_URL = "/api/v1/exports";

	@MockitoBean
	private CheckinRepository checkinRepository;

	@MockitoBean
	private FormationAttendanceRepository attendanceRepository;

	@MockitoBean
	private FormationRepository formationRepository;

	@MockitoBean
	private UserRepository userRepository;

	@MockitoBean
	private AuditLogRepository auditLogRepository;

	@MockitoBean
	private PdfReportGenerator pdfReportGenerator;

	@MockitoBean
	private UserService userService;

	@Autowired
	private MockMvc mockMvc;

	private User user;
	private Checkin checkin;
	private Formation formation;
	private FormationAttendance attendance;

	@BeforeEach
	void setUp() {
		user = new User();
		user.setId(1);
		user.setUsername("user1");
		user.setPersonalCode("1234");
		user.setFirstName("John");
		user.setLastName("Doe");
		user.setIsWorking(true);
		
		Authorities auth = new Authorities();
		auth.setAuthority("ADMIN");
		user.setAuthority(auth);

		checkin = new Checkin();
		checkin.setId(10);
		checkin.setUser(user);
		checkin.setCheckInType(CheckinType.ENTRADA);
		checkin.setCheckInDate(LocalDateTime.of(2026, 8, 1, 9, 0));

		formation = new Formation();
		formation.setId(100);
		formation.setName("Course");
		formation.setFormationDate(LocalDateTime.of(2026, 8, 1, 10, 0));

		attendance = new FormationAttendance();
		attendance.setUser(user);
		attendance.setFormation(formation);
		attendance.setCheckInDate(LocalDateTime.of(2026, 8, 1, 10, 0));
		attendance.setCheckOutDate(LocalDateTime.of(2026, 8, 1, 12, 0));
		attendance.setSignature("signature_data");
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportUsersCsv() throws Exception {
		when(userRepository.findAll()).thenReturn(List.of(user));
		mockMvc.perform(get(BASE_URL + "/users/csv"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = "ADMIN")
	void shouldExportUsersExcel() throws Exception {
		when(userRepository.findAll()).thenReturn(List.of(user));

		mockMvc.perform(get(BASE_URL + "/users/excel"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = "ADMIN")
	void shouldExportAuditPdf() throws Exception {
		AuditLog log = new AuditLog("TEST_ACTION", "admin", "details", "127.0.0.1");
		when(auditLogRepository.findAll()).thenReturn(List.of(log));
		when(pdfReportGenerator.generateAuditLogPdf(any())).thenReturn(new byte[]{1, 2, 3});

		mockMvc.perform(get(BASE_URL + "/audit/pdf"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportCheckinsCsv() throws Exception {
		when(checkinRepository.findAll()).thenReturn(List.of(checkin));
		mockMvc.perform(get(BASE_URL + "/checkins/csv"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportCheckinsExcel() throws Exception {
		when(checkinRepository.findAll()).thenReturn(List.of(checkin));
		mockMvc.perform(get(BASE_URL + "/checkins/excel"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportFormationsCsv() throws Exception {
		when(attendanceRepository.findAll()).thenReturn(List.of(attendance));
		mockMvc.perform(get(BASE_URL + "/formations/csv"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportFormationsExcel() throws Exception {
		when(formationRepository.findAll()).thenReturn(List.of(formation, new Formation()));
		FormationAttendance nullAttendance = new FormationAttendance();
		nullAttendance.setUser(null);
		nullAttendance.setFormation(null);
		when(attendanceRepository.findAll()).thenReturn(List.of(attendance, nullAttendance));
		mockMvc.perform(get(BASE_URL + "/formations/excel"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportFormationsCsvWithNulls() throws Exception {
		FormationAttendance nullAttendance = new FormationAttendance();
		nullAttendance.setUser(null);
		nullAttendance.setFormation(null);
		when(attendanceRepository.findAll()).thenReturn(List.of(attendance, nullAttendance));
		mockMvc.perform(get(BASE_URL + "/formations/csv"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportUsersCsvAndExcelWithNulls() throws Exception {
		User nullUser = new User();
		nullUser.setAuthority(null);
		when(userRepository.findAll()).thenReturn(List.of(user, nullUser));
		
		mockMvc.perform(get(BASE_URL + "/users/csv"))
				.andExpect(status().isOk());
		mockMvc.perform(get(BASE_URL + "/users/excel"))
				.andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportCheckinsCsvAndExcelWithNulls() throws Exception {
		Checkin nullCheckin = new Checkin();
		nullCheckin.setUser(null);
		when(checkinRepository.findAll()).thenReturn(List.of(checkin, nullCheckin));
		
		mockMvc.perform(get(BASE_URL + "/checkins/csv"))
				.andExpect(status().isOk());
		mockMvc.perform(get(BASE_URL + "/checkins/excel"))
				.andExpect(status().isOk());
	}
}

