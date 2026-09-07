package org.springframework.samples.smartcheckin.totp;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.formation.FormationStatus;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

@WebMvcTest(controllers = TotpRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class TotpRestControllerTests {

	private static final String BASE_URL = "/api/v1/totp";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private TotpService totpService;

	@MockitoBean
	private FormationRepository formationRepository;

	@Test
	@WithMockUser
	void testGetCurrentTokenWithoutFormation() throws Exception {
		when(totpService.getCurrentToken(null)).thenReturn("123456");

		mockMvc.perform(get(BASE_URL + "/current"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").value("123456"));
	}

	@Test
	@WithMockUser
	void testGetCurrentTokenWithFormation() throws Exception {
		Formation formation = new Formation();
		formation.setId(1);
		formation.setIsClosed(false);
		formation.setStatus(FormationStatus.PUBLISHED);

		when(formationRepository.findById(1)).thenReturn(Optional.of(formation));
		when(totpService.getCurrentToken(any())).thenReturn("654321");

		mockMvc.perform(get(BASE_URL + "/current").param("formationId", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").value("654321"));
	}

	@Test
	@WithMockUser
	void testGetCurrentTokenWithClosedFormationReturnsBadRequest() throws Exception {
		Formation formation = new Formation();
		formation.setId(2);
		formation.setIsClosed(true);
		formation.setStatus(FormationStatus.CLOSED);

		when(formationRepository.findById(2)).thenReturn(Optional.of(formation));

		mockMvc.perform(get(BASE_URL + "/current").param("formationId", "2"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Esta formación ya ha finalizado y está cerrada. No se pueden generar códigos QR ni fichajes."));
	}
}

