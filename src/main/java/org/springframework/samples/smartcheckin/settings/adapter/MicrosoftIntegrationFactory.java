package org.springframework.samples.smartcheckin.settings.adapter;

import org.springframework.stereotype.Component;

/**
 * Factoría concreta que garantiza que todos los servicios que instanciamos 
 * pertenecen a la familia de Microsoft (OneDrive, Outlook, etc.).
 */
@Component
public class MicrosoftIntegrationFactory implements CloudIntegrationFactory {

    private final OneDriveAdapterImpl oneDriveAdapter;

    public MicrosoftIntegrationFactory(OneDriveAdapterImpl oneDriveAdapter) {
        this.oneDriveAdapter = oneDriveAdapter;
    }

    @Override
    public CloudStorageAdapter createStorageAdapter() {
        return oneDriveAdapter; // OneDrive es de Microsoft
    }

}
