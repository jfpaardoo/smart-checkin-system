package org.springframework.samples.smartcheckin.settings.adapter;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CloudIntegrationFactoryTests {

    @Mock
    private OneDriveAdapterImpl oneDriveAdapter;

    @InjectMocks
    private MicrosoftIntegrationFactory microsoftFactory;

    // ─── GoogleIntegrationFactory ─────────────────────────────────────────────

    @Test
    void googleFactory_createStorageAdapter_throwsUnsupportedOperationException() {
        GoogleIntegrationFactory factory = new GoogleIntegrationFactory();
        UnsupportedOperationException ex = assertThrows(
                UnsupportedOperationException.class,
                factory::createStorageAdapter
        );
        assertNotNull(ex.getMessage());
        assertTrue(ex.getMessage().contains("Google Drive"));
    }

    // ─── MicrosoftIntegrationFactory ─────────────────────────────────────────

    @Test
    void testMicrosoftFactoryCreateStorageAdapterReturnsOneDriveAdapter() {
        CloudStorageAdapter result = microsoftFactory.createStorageAdapter();
        assertSame(oneDriveAdapter, result);
    }

    @Test
    void testMicrosoftFactoryCreateStorageAdapterIsNotNull() {
        assertNotNull(microsoftFactory.createStorageAdapter());
    }

    @Test
    void testMicrosoftFactoryCreateStorageAdapterReturnsInstanceOfCloudStorageAdapter() {
        CloudStorageAdapter adapter = microsoftFactory.createStorageAdapter();
        assertInstanceOf(CloudStorageAdapter.class, adapter);
    }
}
