package org.springframework.samples.smartcheckin.settings;

import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;

import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.user.UserRepository;

class DatabaseBackupServiceTests {

	private UserRepository userRepository;
	private FormationRepository formationRepository;
	private AuditLogRepository auditLogRepository;
	private CloudStorageAdapter cloudStorageAdapter;
	private DatabaseBackupService backupService;

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		formationRepository = mock(FormationRepository.class);
		auditLogRepository = mock(AuditLogRepository.class);
		cloudStorageAdapter = mock(CloudStorageAdapter.class);
		backupService = new DatabaseBackupService(userRepository, formationRepository, auditLogRepository, cloudStorageAdapter, new ObjectMapper());
	}

	@Test
	void testCreateAndUploadBackup() throws Exception {
		when(userRepository.findAll()).thenReturn(List.of());
		when(formationRepository.findAll()).thenReturn(List.of());
		when(auditLogRepository.findAll()).thenReturn(List.of());

		backupService.createAndUploadBackup();

		verify(cloudStorageAdapter, times(1)).uploadBackup(any(byte[].class), anyString());
	}
}
