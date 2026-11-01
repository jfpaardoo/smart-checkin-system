package org.springframework.samples.smartcheckin.settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonEncoding;
import com.fasterxml.jackson.databind.DeserializationFeature;
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
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Consumer;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DatabaseBackupService {

    private static final String KEY_COMPANIES = "companies";
    private static final String KEY_USERS = "users";
    private static final String KEY_FORMATIONS = "formations";
    private static final String KEY_ATTENDANCES = "attendances";
    private static final String KEY_AUDIT_LOGS = "auditLogs";
    private static final String KEY_CHECKINS = "checkins";

    // Protección anti-Zip-Bomb y OOM
    private static final int MAX_ZIP_ENTRIES = 10;
    private static final long MAX_UNCOMPRESSED_SIZE_BYTES = 50L * 1024 * 1024; // 50 MB límite de descompresión

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final FormationRepository formationRepository;
    private final FormationAttendanceRepository formationAttendanceRepository;
    private final AuditLogRepository auditLogRepository;
    private final CloudStorageAdapter cloudStorageAdapter;
    private final ObjectMapper objectMapper;
    private final CheckinRepository checkinRepository;

    public DatabaseBackupService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            FormationRepository formationRepository,
            FormationAttendanceRepository formationAttendanceRepository,
            AuditLogRepository auditLogRepository,
            CloudStorageAdapter cloudStorageAdapter,
            ObjectMapper objectMapper) {
        this(companyRepository, userRepository, formationRepository, formationAttendanceRepository,
                auditLogRepository, cloudStorageAdapter, objectMapper, null);
    }

    @Autowired
    public DatabaseBackupService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            FormationRepository formationRepository,
            FormationAttendanceRepository formationAttendanceRepository,
            AuditLogRepository auditLogRepository,
            CloudStorageAdapter cloudStorageAdapter,
            ObjectMapper objectMapper,
            CheckinRepository checkinRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.formationRepository = formationRepository;
        this.formationAttendanceRepository = formationAttendanceRepository;
        this.auditLogRepository = auditLogRepository;
        this.cloudStorageAdapter = cloudStorageAdapter;
        this.checkinRepository = checkinRepository;
        this.objectMapper = objectMapper.copy()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * Generates a full compressed backup package streaming directly into ZipOutputStream
     * to avoid OutOfMemoryError in constrained heap environments (-Xmx320m).
     */
    public byte[] generateBackupZip() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry("db_backup.json");
            zos.putNextEntry(entry);

            try (JsonGenerator jg = objectMapper.getFactory().createGenerator(zos, JsonEncoding.UTF8)) {
                jg.disable(JsonGenerator.Feature.AUTO_CLOSE_TARGET);
                jg.writeStartObject();
                jg.writeStringField("version", "1.3.0");
                jg.writeStringField("timestamp", LocalDateTime.now(ZoneId.systemDefault()).toString());

                writeEntityArray(jg, KEY_COMPANIES, companyRepository.findAll());
                writeEntityArray(jg, KEY_USERS, userRepository.findAll());
                writeEntityArray(jg, KEY_FORMATIONS, formationRepository.findAll());
                writeEntityArray(jg, KEY_ATTENDANCES, formationAttendanceRepository.findAll());
                writeEntityArray(jg, KEY_AUDIT_LOGS, auditLogRepository.findAll());
                if (checkinRepository != null) {
                    writeEntityArray(jg, KEY_CHECKINS, checkinRepository.findAll());
                }

                jg.writeEndObject();
                jg.flush();
            }

            zos.closeEntry();
        }

        return baos.toByteArray();
    }

    private void writeEntityArray(JsonGenerator jg, String key, Iterable<?> entities) throws IOException {
        jg.writeArrayFieldStart(key);
        if (entities != null) {
            for (Object entity : entities) {
                objectMapper.writeValue(jg, entity);
            }
        }
        jg.writeEndArray();
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

        restoreEntityList(rootNode, KEY_COMPANIES, Company.class, companyRepository::save, restoredStats);
        restoreEntityList(rootNode, KEY_USERS, User.class, userRepository::save, restoredStats);
        restoreEntityList(rootNode, KEY_FORMATIONS, Formation.class, formationRepository::save, restoredStats);
        restoreEntityList(rootNode, KEY_ATTENDANCES, FormationAttendance.class, formationAttendanceRepository::save, restoredStats);
        restoreEntityList(rootNode, KEY_AUDIT_LOGS, AuditLog.class, auditLogRepository::save, restoredStats);
        if (checkinRepository != null) {
            restoreEntityList(rootNode, KEY_CHECKINS, Checkin.class, checkinRepository::save, restoredStats);
        }

        log.info("Disaster recovery restore completed successfully with stats: {}", restoredStats);
        return restoredStats;
    }

    private <T> void restoreEntityList(JsonNode rootNode, String key, Class<T> clazz, Consumer<T> persister,
            Map<String, Integer> stats) throws IOException {
        if (!rootNode.has(key)) {
            return;
        }
        CollectionType listType = objectMapper.getTypeFactory().constructCollectionType(List.class, clazz);
        List<T> list = objectMapper.readerFor(listType).readValue(rootNode.get(key));
        for (T item : list) {
            persister.accept(item);
        }
        stats.put(key, list.size());
    }

    private String extractJsonFromZip(byte[] zipBytes) throws IOException {
        int entryCount = 0;
        long totalBytesRead = 0;
        String jsonResult = null;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entryCount++;
                if (entryCount > MAX_ZIP_ENTRIES) {
                    throw new SecurityException("El archivo ZIP contiene demasiadas entradas (posible Zip Bomb).");
                }

                if (jsonResult == null && ("db_backup.json".equals(entry.getName()) || entry.getName().endsWith(".json"))) {
                    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                    byte[] data = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = zis.read(data, 0, data.length)) != -1) {
                        totalBytesRead += bytesRead;
                        if (totalBytesRead > MAX_UNCOMPRESSED_SIZE_BYTES) {
                            throw new SecurityException("El tamaño descomprimido del backup supera el límite de seguridad de 50MB (posible Zip Bomb).");
                        }
                        buffer.write(data, 0, bytesRead);
                    }
                    jsonResult = buffer.toString(StandardCharsets.UTF_8);
                }
            }
        }
        if (jsonResult != null) {
            return jsonResult;
        }
        throw new IllegalArgumentException("Invalid backup package: no JSON backup file found inside ZIP.");
    }
}
