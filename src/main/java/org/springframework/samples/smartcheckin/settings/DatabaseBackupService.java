package org.springframework.samples.smartcheckin.settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.audit.AuditLogRepository;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import java.io.IOException;

@Service
public class DatabaseBackupService {

    private final UserRepository userRepository;
    private final FormationRepository formationRepository;
    private final AuditLogRepository auditLogRepository;
    private final CloudStorageAdapter cloudStorageAdapter;
    private final ObjectMapper objectMapper;

    @Autowired
    public DatabaseBackupService(UserRepository userRepository, 
                               FormationRepository formationRepository,
                               AuditLogRepository auditLogRepository,
                               CloudStorageAdapter cloudStorageAdapter,
                               ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.formationRepository = formationRepository;
        this.auditLogRepository = auditLogRepository;
        this.cloudStorageAdapter = cloudStorageAdapter;
        this.objectMapper = objectMapper;
    }

    public void createAndUploadBackup() throws IOException {
        Map<String, Object> exportData = new HashMap<>();
        exportData.put("users", userRepository.findAll());
        exportData.put("formations", formationRepository.findAll());
        exportData.put("auditLogs", auditLogRepository.findAll());

        String json = objectMapper.writeValueAsString(exportData);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry("db_backup.json");
            zos.putNextEntry(entry);
            zos.write(json.getBytes());
            zos.closeEntry();
        }
        
        String dateStr = LocalDateTime.now(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "smartcheckin_backup_" + dateStr + ".zip";
        
        cloudStorageAdapter.uploadBackup(baos.toByteArray(), fileName);
    }
}