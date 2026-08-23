package org.springframework.samples.smartcheckin.settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;

import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.samples.smartcheckin.company.Company;
import org.springframework.samples.smartcheckin.company.CompanyRepository;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.formation.FormationAttendanceRepository;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@SuppressWarnings("null")
public class DatabaseBackupService {

    private static final String KEY_COMPANIES = "companies";
    private static final String KEY_USERS = "users";
    private static final String KEY_FORMATIONS = "formations";
    private static final String KEY_ATTENDANCES = "attendances";
    private static final String KEY_AUDIT_LOGS = "auditLogs";

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final FormationRepository formationRepository;
    private final FormationAttendanceRepository formationAttendanceRepository;
    private final AuditLogRepository auditLogRepository;
    private final CloudStorageAdapter cloudStorageAdapter;
    private final ObjectMapper objectMapper;

    @Autowired
    public DatabaseBackupService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            FormationRepository formationRepository,
            FormationAttendanceRepository formationAttendanceRepository,
            AuditLogRepository auditLogRepository,
            CloudStorageAdapter cloudStorageAdapter,
            ObjectMapper objectMapper) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.formationRepository = formationRepository;
        this.formationAttendanceRepository = formationAttendanceRepository;
        this.auditLogRepository = auditLogRepository;
        this.cloudStorageAdapter = cloudStorageAdapter;
        this.objectMapper = objectMapper.copy()
            .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Generates a full compressed backup package containing all core entities.
     */
    public byte[] generateBackupZip() throws IOException {
        Map<String, Object> exportData = new LinkedHashMap<>();
        exportData.put("version", "1.2.0");
        exportData.put("timestamp", LocalDateTime.now(ZoneId.systemDefault()).toString());
        exportData.put(KEY_COMPANIES, companyRepository.findAll());
        exportData.put(KEY_USERS, userRepository.findAll());
        exportData.put(KEY_FORMATIONS, formationRepository.findAll());
        exportData.put(KEY_ATTENDANCES, formationAttendanceRepository.findAll());
        exportData.put(KEY_AUDIT_LOGS, auditLogRepository.findAll());

        String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(exportData);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry("db_backup.json");
            zos.putNextEntry(entry);
            zos.write(json.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }

        return baos.toByteArray();
    }

    /**
     * Creates and uploads the backup directly to cloud storage (OneDrive, Local, etc.)
     */
    public void createAndUploadBackup() throws IOException {
        byte[] zipBytes = generateBackupZip();
        String dateStr = LocalDateTime.now(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "smartcheckin_backup_" + dateStr + ".zip";
        cloudStorageAdapter.uploadBackup(zipBytes, fileName);
        log.info("Database backup created and uploaded successfully: {}", fileName);
    }

    /**
     * Restores database state from a backup ZIP file.
     * Validates data structure and restores companies, users, formations, attendances and audit logs.
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Integer> restoreBackupFromZip(byte[] zipBytes) throws IOException {
        String jsonContent = extractJsonFromZip(zipBytes);
        return doRestoreFromJson(jsonContent);
    }

    /**
     * Restores database state from raw JSON backup content.
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Integer> restoreFromJson(String json) throws IOException {
        return doRestoreFromJson(json);
    }

    private Map<String, Integer> doRestoreFromJson(String json) throws IOException {
        Map<String, Integer> restoredStats = new HashMap<>();
        JsonNode rootNode = objectMapper.readTree(json);

        // 1. Restore Companies
        if (rootNode.has(KEY_COMPANIES)) {
            CollectionType listType = objectMapper.getTypeFactory().constructCollectionType(List.class, Company.class);
            List<Company> companies = objectMapper.readerFor(listType).readValue(rootNode.get(KEY_COMPANIES));
            for (Company c : companies) {
                companyRepository.save(c);
            }
            restoredStats.put(KEY_COMPANIES, companies.size());
        }

        // 2. Restore Users
        if (rootNode.has(KEY_USERS)) {
            CollectionType listType = objectMapper.getTypeFactory().constructCollectionType(List.class, User.class);
            List<User> users = objectMapper.readerFor(listType).readValue(rootNode.get(KEY_USERS));
            for (User u : users) {
                userRepository.save(u);
            }
            restoredStats.put(KEY_USERS, users.size());
        }

        // 3. Restore Formations
        if (rootNode.has(KEY_FORMATIONS)) {
            CollectionType listType = objectMapper.getTypeFactory().constructCollectionType(List.class,
                    Formation.class);
            List<Formation> formations = objectMapper.readerFor(listType).readValue(rootNode.get(KEY_FORMATIONS));
            for (Formation f : formations) {
                formationRepository.save(f);
            }
            restoredStats.put(KEY_FORMATIONS, formations.size());
        }

        // 4. Restore Attendances
        if (rootNode.has(KEY_ATTENDANCES)) {
            CollectionType listType = objectMapper.getTypeFactory().constructCollectionType(List.class,
                    FormationAttendance.class);
            List<FormationAttendance> attendances = objectMapper.readerFor(listType).readValue(rootNode.get(KEY_ATTENDANCES));
            for (FormationAttendance a : attendances) {
                formationAttendanceRepository.save(a);
            }
            restoredStats.put(KEY_ATTENDANCES, attendances.size());
        }

        // 5. Restore Audit Logs
        if (rootNode.has(KEY_AUDIT_LOGS)) {
            CollectionType listType = objectMapper.getTypeFactory().constructCollectionType(List.class, AuditLog.class);
            List<AuditLog> auditLogs = objectMapper.readerFor(listType).readValue(rootNode.get(KEY_AUDIT_LOGS));
            for (AuditLog logItem : auditLogs) {
                auditLogRepository.save(logItem);
            }
            restoredStats.put(KEY_AUDIT_LOGS, auditLogs.size());
        }

        log.info("Disaster recovery restore completed successfully with stats: {}", restoredStats);
        return restoredStats;
    }

    private String extractJsonFromZip(byte[] zipBytes) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if ("db_backup.json".equals(entry.getName()) || entry.getName().endsWith(".json")) {
                    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                    byte[] data = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = zis.read(data, 0, data.length)) != -1) {
                        buffer.write(data, 0, bytesRead);
                    }
                    return buffer.toString(StandardCharsets.UTF_8);
                }
            }
        }
        throw new IllegalArgumentException("Invalid backup package: no JSON backup file found inside ZIP.");
    }
}