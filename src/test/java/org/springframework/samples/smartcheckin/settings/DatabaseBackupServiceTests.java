package org.springframework.samples.smartcheckin.settings;

import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.samples.smartcheckin.company.Company;
import org.springframework.samples.smartcheckin.company.CompanyRepository;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@SuppressWarnings("null")
class DatabaseBackupServiceTests {

    private CompanyRepository companyRepository;
    private UserRepository userRepository;
    private FormationRepository formationRepository;
    private FormationAttendanceRepository formationAttendanceRepository;
    private AuditLogRepository auditLogRepository;
    private CloudStorageAdapter cloudStorageAdapter;
    private DatabaseBackupService backupService;

    @BeforeEach
    void setUp() {
        companyRepository = mock(CompanyRepository.class);
        userRepository = mock(UserRepository.class);
        formationRepository = mock(FormationRepository.class);
        formationAttendanceRepository = mock(FormationAttendanceRepository.class);
        auditLogRepository = mock(AuditLogRepository.class);
        cloudStorageAdapter = mock(CloudStorageAdapter.class);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        backupService = new DatabaseBackupService(
            companyRepository,
            userRepository,
            formationRepository,
            formationAttendanceRepository,
            auditLogRepository,
            cloudStorageAdapter,
            objectMapper
        );
    }

    @Test
    @DisplayName("Genera y sube el backup comprimido a la nube correctamente")
    void testCreateAndUploadBackup() throws Exception {
        when(companyRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());
        when(formationRepository.findAll()).thenReturn(List.of());
        when(formationAttendanceRepository.findAll()).thenReturn(List.of());
        when(auditLogRepository.findAll()).thenReturn(List.of());

        backupService.createAndUploadBackup();

        verify(cloudStorageAdapter, times(1)).uploadBackup(any(byte[].class), anyString());
    }

    @Test
    @DisplayName("Prueba de Fuego: Generar Backup real, verificar contenido ZIP y restaurar entidades íntegras")
    void testFullBackupGenerationAndDisasterRecoveryRestore() throws Exception {
        // 1. Arrange mock live data
        Company testCompany = Company.builder().name("Distribution Academy SL").description("Sede Central").build();
        testCompany.setId(1);

        User testUser = new User();
        testUser.setId(10);
        testUser.setUsername("testuser");
        testUser.setFirstName("Victor");
        testUser.setLastName("Pardo");
        testUser.setEmail("victor@distributionacademy.com");

        Formation testFormation = Formation.builder()
            .name("Prevención de Riesgos 2026")
            .description("Formación de seguridad laboral")
            .formationDate(LocalDateTime.of(2026, 8, 23, 10, 0))
            .location("BA VILLAFRANCA")
            .trainer("VICTOR PARDO")
            .build();
        testFormation.setId(100);

        FormationAttendance testAttendance = new FormationAttendance();
        testAttendance.setId(500);
        testAttendance.setUser(testUser);
        testAttendance.setFormation(testFormation);
        testAttendance.setWithinWorkingHours(true);
        testAttendance.setSignature("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
        testAttendance.setCheckInDate(LocalDateTime.of(2026, 8, 23, 10, 5));
        testAttendance.setCheckOutDate(LocalDateTime.of(2026, 8, 23, 14, 0));

        AuditLog testLog = new AuditLog();
        testLog.setId(1000);
        testLog.setUsername("testuser");
        testLog.setAction("FORMATION_CHECKOUT");
        testLog.setTimestamp(LocalDateTime.of(2026, 8, 23, 14, 1));

        when(companyRepository.findAll()).thenReturn(List.of(testCompany));
        when(userRepository.findAll()).thenReturn(List.of(testUser));
        when(formationRepository.findAll()).thenReturn(List.of(testFormation));
        when(formationAttendanceRepository.findAll()).thenReturn(List.of(testAttendance));
        when(auditLogRepository.findAll()).thenReturn(List.of(testLog));

        // 2. Act - Generate real Backup ZIP
        byte[] backupZipBytes = backupService.generateBackupZip();
        assertNotNull(backupZipBytes, "El archivo ZIP de backup no debe ser nulo");
        assertTrue(backupZipBytes.length > 50, "El ZIP debe contener bytes reales");

        // 3. Act - Disaster Recovery Restore
        Map<String, Integer> restoreStats = backupService.restoreBackupFromZip(backupZipBytes);

        // 4. Assert - Verify all records were restored into repositories
        assertNotNull(restoreStats);
        assertEquals(1, restoreStats.get("companies"), "Debe restaurar exactamente 1 empresa");
        assertEquals(1, restoreStats.get("users"), "Debe restaurar exactamente 1 usuario");
        assertEquals(1, restoreStats.get("formations"), "Debe restaurar exactamente 1 formación");
        assertEquals(1, restoreStats.get("attendances"), "Debe restaurar exactamente 1 asistencia con firma y jornada");
        assertEquals(1, restoreStats.get("auditLogs"), "Debe restaurar exactamente 1 registro de auditoría");

        verify(companyRepository, atLeastOnce()).save(any(Company.class));
        verify(userRepository, atLeastOnce()).save(any(User.class));
        verify(formationRepository, atLeastOnce()).save(any(Formation.class));
        verify(formationAttendanceRepository, atLeastOnce()).save(any(FormationAttendance.class));
        verify(auditLogRepository, atLeastOnce()).save(any(AuditLog.class));
    }
}
