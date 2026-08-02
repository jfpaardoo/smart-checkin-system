package org.springframework.samples.smartcheckin.analytics;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.hasSize;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.statistics.PlatformStatistic;
import org.springframework.samples.smartcheckin.statistics.StatisticsRepository;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SuppressWarnings("null")
@WebMvcTest(controllers = AnalyticsRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class AnalyticsRestControllerTests {

	private static final String BASE_URL = "/api/v1/analytics";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private StatisticsRepository statisticsRepository;

	@MockitoBean
	private AnalyticsService analyticsService;
	
	@MockitoBean
	private CheckinRepository checkinRepository;

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAnalyticsEmptyStats() throws Exception {
		when(statisticsRepository.findLast30Days()).thenReturn(List.of());
		when(checkinRepository.count()).thenReturn(5L);

		mockMvc.perform(get(BASE_URL))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].totalCheckins").value(5))
				.andExpect(jsonPath("$[0].activeFormations").value(0))
				.andExpect(jsonPath("$[0].averageHoursPerEmployee").value(0.0))
				.andExpect(jsonPath("$[0].formationAttendanceRate").value(100.0));
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAnalyticsContainsToday() throws Exception {
		PlatformStatistic todayStat = new PlatformStatistic();
		todayStat.setDate(LocalDate.now(ZoneId.systemDefault()));
		todayStat.setTotalCheckins(2L); // Old value
		todayStat.setActiveFormations(10L);
		todayStat.setAverageHoursPerEmployee(8.0);
		todayStat.setFormationAttendanceRate(95.0);
		
		when(statisticsRepository.findLast30Days()).thenReturn(List.of(todayStat));
		when(checkinRepository.count()).thenReturn(20L); // New live value

		mockMvc.perform(get(BASE_URL))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].totalCheckins").value(20))
				.andExpect(jsonPath("$[0].activeFormations").value(10));
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAnalyticsDoesNotContainToday() throws Exception {
		PlatformStatistic yesterdayStat = new PlatformStatistic();
		yesterdayStat.setDate(LocalDate.now(ZoneId.systemDefault()).minusDays(1));
		yesterdayStat.setTotalCheckins(15L);
		yesterdayStat.setActiveFormations(5L);
		yesterdayStat.setAverageHoursPerEmployee(7.5);
		yesterdayStat.setFormationAttendanceRate(90.0);
		
		when(statisticsRepository.findLast30Days()).thenReturn(List.of(yesterdayStat));
		when(checkinRepository.count()).thenReturn(25L);

		mockMvc.perform(get(BASE_URL))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[0].totalCheckins").value(25))
				.andExpect(jsonPath("$[0].activeFormations").value(5)) // copied from yesterday
				.andExpect(jsonPath("$[1].totalCheckins").value(15));
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAnalyticsExceeds30Days() throws Exception {
		List<PlatformStatistic> mockStats = new ArrayList<>();
		for (int i = 1; i <= 30; i++) {
			PlatformStatistic stat = new PlatformStatistic();
			stat.setDate(LocalDate.now(ZoneId.systemDefault()).minusDays(i));
			stat.setTotalCheckins((long) i);
			mockStats.add(stat);
		}
		
		when(statisticsRepository.findLast30Days()).thenReturn(mockStats);
		when(checkinRepository.count()).thenReturn(100L);

		mockMvc.perform(get(BASE_URL))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(30)))
				.andExpect(jsonPath("$[0].totalCheckins").value(100))
				.andExpect(jsonPath("$[29].totalCheckins").value(29)); // The last one (which had 30 checkins) was removed
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAllUsersAnalytics() throws Exception {
		when(analyticsService.getAllUsersAnalytics("john")).thenReturn(List.of());

		mockMvc.perform(get(BASE_URL + "/users").param("search", "john")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetUserAnalyticsFound() throws Exception {
		UserAnalyticsDTO dto = new UserAnalyticsDTO();
		when(analyticsService.getUserAnalytics(1)).thenReturn(Optional.of(dto));

		mockMvc.perform(get(BASE_URL + "/users/1")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetUserAnalyticsNotFound() throws Exception {
		when(analyticsService.getUserAnalytics(99)).thenReturn(Optional.empty());

		mockMvc.perform(get(BASE_URL + "/users/99")).andExpect(status().isNotFound());
	}
}
