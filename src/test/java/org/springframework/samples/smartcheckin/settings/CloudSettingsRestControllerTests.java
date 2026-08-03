
package org.springframework.samples.smartcheckin.settings;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@SuppressWarnings("null")
@WebMvcTest(controllers = CloudSettingsRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class CloudSettingsRestControllerTests {

	private static final String BASE_URL = "/api/v1/cloud-settings";

	@MockitoBean
	private CloudSettingsService cloudSettingsService;

	@MockitoBean
	private DatabaseBackupService databaseBackupService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private MockMvc mockMvc;

	private CloudSettings settings;

	@BeforeEach
	void setUp() {
		settings = new CloudSettings();
		settings.setId(1);
		settings.setProvider("ONEDRIVE");
		settings.setOneDriveClientId("client123");
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetSettingsNonNull() throws Exception {
		when(cloudSettingsService.getSettings()).thenReturn(settings);

		mockMvc.perform(get(BASE_URL)).andExpect(status().isOk())
				.andExpect(jsonPath("$.provider").value("ONEDRIVE"));
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetSettingsNullDefault() throws Exception {
		when(cloudSettingsService.getSettings()).thenReturn(null);

		mockMvc.perform(get(BASE_URL)).andExpect(status().isOk())
				.andExpect(jsonPath("$.provider").value("ONEDRIVE"));
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testSaveSettings() throws Exception {
		when(cloudSettingsService.getSettings()).thenReturn(settings);
		when(cloudSettingsService.saveSettings(any(CloudSettings.class))).thenReturn(settings);

		CloudSettingsDTO dto = new CloudSettingsDTO(settings);

		mockMvc.perform(post(BASE_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(dto))).andExpect(status().isOk())
				.andExpect(jsonPath("$.provider").value("ONEDRIVE"));
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testForceBackupSuccess() throws Exception {
		doNothing().when(databaseBackupService).createAndUploadBackup();

		mockMvc.perform(post(BASE_URL + "/backup").with(csrf())).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testForceBackupFailure() throws Exception {
		doThrow(new RuntimeException("OneDrive unavailable")).when(databaseBackupService).createAndUploadBackup();

		mockMvc.perform(post(BASE_URL + "/backup").with(csrf())).andExpect(status().isBadRequest());
	}
}

