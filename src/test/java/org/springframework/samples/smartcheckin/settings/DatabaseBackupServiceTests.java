package org.springframework.samples.smartcheckin.settings;

import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
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
	private OneDriveService oneDriveService;
	private DatabaseBackupService backupService;

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		formationRepository = mock(FormationRepository.class);
		auditLogRepository = mock(AuditLogRepository.class);
		oneDriveService = mock(OneDriveService.class);
		backupService = new DatabaseBackupService(userRepository, formationRepository, auditLogRepository, oneDriveService, new ObjectMapper());
	}

	@Test
	void testCreateAndUploadBackup() throws IOException {
		when(userRepository.findAll()).thenReturn(List.of());
		when(formationRepository.findAll()).thenReturn(List.of());
		when(auditLogRepository.findAll()).thenReturn(List.of());

		backupService.createAndUploadBackup();

		verify(oneDriveService, times(1)).uploadBackup(any(byte[].class), anyString());
	}
}
