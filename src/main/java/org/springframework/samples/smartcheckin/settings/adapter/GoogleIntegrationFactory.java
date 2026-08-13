package org.springframework.samples.smartcheckin.settings.adapter;

import org.springframework.stereotype.Component;

/**
 * Placeholder para la Factoría concreta de Google (GCP / G-Suite).
 * En el futuro, si se requiere usar Google Drive o Gmail, se instanciarían aquí
 * (ej. devolviendo un GoogleDriveAdapterImpl).
 */
@Component
public class GoogleIntegrationFactory implements CloudIntegrationFactory {

    @Override
    public CloudStorageAdapter createStorageAdapter() {
        throw new UnsupportedOperationException("Google Drive integration no está implementada todavía.");
    }

}
