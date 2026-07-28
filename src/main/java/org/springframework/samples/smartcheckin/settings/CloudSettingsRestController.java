package org.springframework.samples.smartcheckin.settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/cloud-settings")
@Slf4j
public class CloudSettingsRestController {

    private final CloudSettingsService cloudSettingsService;
    private final DatabaseBackupService databaseBackupService;

    @Autowired
    public CloudSettingsRestController(CloudSettingsService cloudSettingsService, DatabaseBackupService databaseBackupService) {
        this.cloudSettingsService = cloudSettingsService;
        this.databaseBackupService = databaseBackupService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CloudSettingsDTO> getSettings() {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null) {
            settings = new CloudSettings();
            settings.setProvider("ONEDRIVE");
        }
        return ResponseEntity.ok(new CloudSettingsDTO(settings));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CloudSettingsDTO> saveSettings(@RequestBody CloudSettingsDTO settingsDto) {
        CloudSettings existing = cloudSettingsService.getSettings();
        CloudSettings toSave = settingsDto.toEntity(existing);
        CloudSettings savedSettings = cloudSettingsService.saveSettings(toSave);
        return ResponseEntity.ok(new CloudSettingsDTO(savedSettings));
    }

    @PostMapping("/backup")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> forceBackup() {
        try {
            databaseBackupService.createAndUploadBackup();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error forcing backup: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

}
