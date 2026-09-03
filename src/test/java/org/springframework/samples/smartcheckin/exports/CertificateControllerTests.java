package org.springframework.samples.smartcheckin.exports;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CertificateController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class CertificateControllerTests {

	private static final String BASE_URL = "/api/v1/certificates";
	private static final String ATTENDANCE_1_URL = "/attendance/1";

	@MockitoBean
	private CertificateGeneratorService certificateGeneratorService;

	@MockitoBean
	private FormationAttendanceRepository attendanceRepository;

	@Autowired
	@SuppressWarnings("java:S6813")
	private MockMvc mockMvc;

	private FormationAttendance attendance;

	@BeforeEach
	void setUp() {
		User user = new User();
		user.setUsername("user1");
		user.setPersonalCode("1234");

		attendance = new FormationAttendance();
		attendance.setId(1);
		attendance.setUser(user);
		attendance.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
		attendance.setCheckOutDate(LocalDateTime.now(ZoneId.systemDefault()).plusHours(2));
	}

	@Test
	@WithMockUser(username = "admin", authorities = {"ADMIN"})
	void testDownloadCertificateAdminSuccess() throws Exception {
		when(attendanceRepository.findById(1)).thenReturn(Optional.of(attendance));
		when(certificateGeneratorService.generateCertificatePdf(attendance)).thenReturn(new byte[]{10, 20, 30});

		mockMvc.perform(get(BASE_URL + ATTENDANCE_1_URL)).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(username = "user1", authorities = {"EMPLOYEE"})
	void testDownloadCertificateOwnerSuccess() throws Exception {
		when(attendanceRepository.findById(1)).thenReturn(Optional.of(attendance));
		when(certificateGeneratorService.generateCertificatePdf(attendance)).thenReturn(new byte[]{1, 2, 3});

		mockMvc.perform(get(BASE_URL + ATTENDANCE_1_URL)).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(username = "otherUser", authorities = {"EMPLOYEE"})
	void testDownloadCertificateForbidden() throws Exception {
		when(attendanceRepository.findById(1)).thenReturn(Optional.of(attendance));

		mockMvc.perform(get(BASE_URL + ATTENDANCE_1_URL)).andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(username = "admin", authorities = {"ADMIN"})
	void testDownloadCertificateNotFound() throws Exception {
		when(attendanceRepository.findById(1)).thenReturn(Optional.empty());

		mockMvc.perform(get(BASE_URL + ATTENDANCE_1_URL)).andExpect(status().isNotFound());
	}

	@Test
    @WithMockUser(username = "admin", authorities = {"ADMIN"})
    void testDownloadCertificateCheckInDateNullNotFound() throws Exception {
        attendance.setCheckInDate(null); // Forzamos la segunda condición del if
        when(attendanceRepository.findById(1)).thenReturn(Optional.of(attendance));

        mockMvc.perform(get(BASE_URL + ATTENDANCE_1_URL)).andExpect(status().isNotFound());
    }

	@Test
	@WithMockUser(username = "admin", authorities = {"ADMIN"})
	void testDownloadCertificateInvalidId() throws Exception {

		mockMvc.perform(get(BASE_URL + "/attendance/abc"))
				.andExpect(status().isInternalServerError());
	}

}

