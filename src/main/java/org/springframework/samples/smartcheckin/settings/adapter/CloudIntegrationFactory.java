package org.springframework.samples.smartcheckin.settings.adapter;

/**
 * Patrón Abstract Factory para Familias de Servicios Externos.
 * Garantiza que la aplicación utilice integraciones (storage, email, etc.)
 * compatibles pertenecientes al mismo proveedor cloud.
 */
public interface CloudIntegrationFactory {
    
    /**
     * Crea o proporciona el adaptador para almacenamiento en la nube (ej. OneDrive o Google Drive).
     */
    CloudStorageAdapter createStorageAdapter();

}
