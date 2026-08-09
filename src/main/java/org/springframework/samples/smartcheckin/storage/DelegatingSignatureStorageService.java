package org.springframework.samples.smartcheckin.storage;

import org.springframework.context.annotation.Primary;
import org.springframework.samples.smartcheckin.settings.CloudSettings;
import org.springframework.samples.smartcheckin.settings.CloudSettingsService;
import org.springframework.stereotype.Service;

@Service
@Primary
public class DelegatingSignatureStorageService implements SignatureStorageService {
    
    private final LocalFileSystemService localService;
    private final OneDriveSignatureStorageService oneDriveService;
    private final CloudSettingsService cloudSettingsService;

    public DelegatingSignatureStorageService(LocalFileSystemService localService, 
                                             OneDriveSignatureStorageService oneDriveService, 
                                             CloudSettingsService cloudSettingsService) {
        this.localService = localService;
        this.oneDriveService = oneDriveService;
        this.cloudSettingsService = cloudSettingsService;
    }

    private SignatureStorageService getActiveService() {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings != null && settings.getOneDriveClientId() != null && !settings.getOneDriveClientId().trim().isEmpty()) {
            return oneDriveService;
        }
        return localService;
    }

    @Override
    public String saveSignature(String base64Data, String pathContext) {
        return getActiveService().saveSignature(base64Data, pathContext);
    }

    @Override
    public byte[] loadSignature(String reference) {
        byte[] data = getActiveService().loadSignature(reference);
        if (data == null || data.length == 0) {
            SignatureStorageService fallback = getActiveService() == oneDriveService ? localService : oneDriveService;
            return fallback.loadSignature(reference);
        }
        return data;
    }

    @Override
    public boolean deleteSignature(String reference) {
        boolean deleted = getActiveService().deleteSignature(reference);
        if (!deleted) {
            SignatureStorageService fallback = getActiveService() == oneDriveService ? localService : oneDriveService;
            return fallback.deleteSignature(reference);
        }
        return deleted;
    }
}
