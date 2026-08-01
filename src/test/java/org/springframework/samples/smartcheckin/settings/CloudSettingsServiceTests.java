package org.springframework.samples.smartcheckin.settings;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CloudSettingsServiceTests {

	private CloudSettingsRepository repository;
	private CloudSettingsService service;

	@BeforeEach
	void setUp() {
		repository = mock(CloudSettingsRepository.class);
		service = new CloudSettingsService(repository);
	}

	@Test
	void testGetSettingsEmpty() {
		when(repository.findAll()).thenReturn(List.of());
		assertNull(service.getSettings());
	}

	@Test
	void testGetSettingsExisting() {
		CloudSettings settings = new CloudSettings();
		settings.setProvider("onedrive");
		when(repository.findAll()).thenReturn(List.of(settings));

		CloudSettings res = service.getSettings();
		assertNotNull(res);
		assertEquals("onedrive", res.getProvider());
	}

	@Test
	void testSaveSettingsNew() {
		CloudSettings settings = new CloudSettings();
		settings.setProvider("onedrive");

		when(repository.findAll()).thenReturn(List.of());
		when(repository.save(settings)).thenReturn(settings);

		CloudSettings saved = service.saveSettings(settings);
		assertEquals("onedrive", saved.getProvider());
	}

	@Test
	void testSaveSettingsExisting() {
		CloudSettings existing = new CloudSettings();
		existing.setProvider("old");

		CloudSettings update = new CloudSettings();
		update.setProvider("new");

		when(repository.findAll()).thenReturn(List.of(existing));
		when(repository.save(existing)).thenReturn(existing);

		CloudSettings saved = service.saveSettings(update);
		assertEquals("new", saved.getProvider());
	}

	@Test
	void testCloudSettingsDTONullBranches() {
		CloudSettingsDTO dtoFromNull = new CloudSettingsDTO(null);
		assertNull(dtoFromNull.getProvider());

		CloudSettingsDTO dto = new CloudSettingsDTO();
		dto.setProvider("onedrive");
		CloudSettings entityFromNull = dto.toEntity(null);
		assertNotNull(entityFromNull);
		assertEquals("onedrive", entityFromNull.getProvider());
	}
}
