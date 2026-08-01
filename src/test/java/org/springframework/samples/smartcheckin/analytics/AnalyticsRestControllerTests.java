package org.springframework.samples.smartcheckin.analytics;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.statistics.StatisticsRepository;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AnalyticsRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class AnalyticsRestControllerTests {

	private static final String BASE_URL = "/api/v1/analytics";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private StatisticsRepository statisticsRepository;

	@MockitoBean
	private AnalyticsService analyticsService;

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAnalytics() throws Exception {
		when(statisticsRepository.findLast30Days()).thenReturn(List.of());

		mockMvc.perform(get(BASE_URL)).andExpect(status().isOk());
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
