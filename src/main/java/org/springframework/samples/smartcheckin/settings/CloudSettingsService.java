package org.springframework.samples.smartcheckin.settings;

import java.util.Iterator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@SuppressWarnings("null")
public class CloudSettingsService {

    private final CloudSettingsRepository cloudSettingsRepository;

    @Autowired
    public CloudSettingsService(CloudSettingsRepository cloudSettingsRepository) {
        this.cloudSettingsRepository = cloudSettingsRepository;
    }

    @Transactional(readOnly = true)
    public CloudSettings getSettings() {
        Iterator<CloudSettings> iterator = cloudSettingsRepository.findAll().iterator();
        return iterator.hasNext() ? iterator.next() : null;
    }

    @Transactional
    public CloudSettings saveSettings(CloudSettings settings) {
        Iterator<CloudSettings> iterator = cloudSettingsRepository.findAll().iterator();
        CloudSettings existing = iterator.hasNext() ? iterator.next() : null;
        if (existing != null) {
            existing.setProvider(settings.getProvider());
            existing.setOneDriveClientId(settings.getOneDriveClientId());
            existing.setOneDriveClientSecret(settings.getOneDriveClientSecret());
            existing.setOneDriveTenantId(settings.getOneDriveTenantId());
            existing.setOneDriveRefreshToken(settings.getOneDriveRefreshToken());
            return cloudSettingsRepository.save(existing);
        } else {
            return cloudSettingsRepository.save(settings);
        }
    }

}
