package org.springframework.samples.smartcheckin.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;

import java.io.IOException;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OneDriveSignatureStorageServiceTests {

    @Mock
    private CloudStorageAdapter cloudStorageAdapter;

    private OneDriveSignatureStorageService service;

    private static final String TEST_CONTEXT = "checkins";

    @BeforeEach
    void setUp() {
        service = new OneDriveSignatureStorageService(cloudStorageAdapter);
    }

    // ─── saveSignature ────────────────────────────────────────────────────────

    @Test
    void saveSignature_nullOrEmpty_returnsNull() {
        assertNull(service.saveSignature(null, TEST_CONTEXT));
        assertNull(service.saveSignature("", TEST_CONTEXT));
        assertNull(service.saveSignature("   ", TEST_CONTEXT));
    }

    @Test
    void saveSignature_fileTooLarge_throwsIllegalArgumentException() {
        String hugeString = "a".repeat(700001);
        assertThrows(IllegalArgumentException.class, () -> service.saveSignature(hugeString, TEST_CONTEXT));
    }

    @Test
    void saveSignature_invalidMimeType_throwsIllegalArgumentException() {
        String invalidPrefix = "data:image/gif;base64,VGhpcyBpcyBhIHRlc3Q=";
        assertThrows(IllegalArgumentException.class, () -> service.saveSignature(invalidPrefix, TEST_CONTEXT));
    }

    @Test
    void saveSignature_invalidPayloadSize_throwsIllegalArgumentException() {
        byte[] tinyBytes = new byte[] { 0x00, 0x01 };
        String base64 = Base64.getEncoder().encodeToString(tinyBytes);
        assertThrows(IllegalArgumentException.class, () -> service.saveSignature(base64, TEST_CONTEXT));
    }

    @Test
    void saveSignature_invalidMagicBytes_throwsIllegalArgumentException() {
        byte[] fakeBytes = new byte[] { 0x00, 0x00, 0x00, 0x00 };
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(fakeBytes);
        assertThrows(IllegalArgumentException.class, () -> service.saveSignature(base64, TEST_CONTEXT));
    }

    @Test
    void saveSignature_validPng_success() throws Exception {
        byte[] pngBytes = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x00, 0x00 };
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);
        when(cloudStorageAdapter.uploadSignature(any(), anyString(), anyString())).thenReturn("oneDriveItemId123");

        String result = service.saveSignature(base64, TEST_CONTEXT);
        assertEquals("oneDriveItemId123", result);
        verify(cloudStorageAdapter).uploadSignature(any(), argThat(name -> name.endsWith(".png")), eq(TEST_CONTEXT));
    }

    @Test
    void saveSignature_validJpeg_success() throws Exception {
        byte[] jpegBytes = new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x00 };
        String base64 = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(jpegBytes);
        when(cloudStorageAdapter.uploadSignature(any(), anyString(), anyString())).thenReturn("oneDriveItemId456");

        String result = service.saveSignature(base64, TEST_CONTEXT);
        assertEquals("oneDriveItemId456", result);
        verify(cloudStorageAdapter).uploadSignature(any(), argThat(name -> name.endsWith(".jpg")), eq(TEST_CONTEXT));
    }

    @Test
    void saveSignature_unexpectedException_throwsRuntimeException() throws Exception {
        byte[] pngBytes = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x00, 0x00 };
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);
        when(cloudStorageAdapter.uploadSignature(any(), anyString(), anyString())).thenThrow(new IOException("OneDrive error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.saveSignature(base64, TEST_CONTEXT));
        assertTrue(ex.getMessage().contains("Error saving signature to OneDrive"));
    }

    // ─── loadSignature ────────────────────────────────────────────────────────

    @Test
    void loadSignature_success() throws Exception {
        byte[] content = new byte[] { 1, 2, 3 };
        when(cloudStorageAdapter.downloadFile("ref123")).thenReturn(content);

        byte[] result = service.loadSignature("ref123");
        assertArrayEquals(content, result);
    }

    @Test
    void loadSignature_exception_returnsEmptyArray() throws Exception {
        when(cloudStorageAdapter.downloadFile("ref123")).thenThrow(new IOException("Network error"));

        byte[] result = service.loadSignature("ref123");
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    // ─── deleteSignature ──────────────────────────────────────────────────────

    @Test
    void deleteSignature_success_returnsTrue() throws Exception {
        doNothing().when(cloudStorageAdapter).deleteFile("ref123");

        assertTrue(service.deleteSignature("ref123"));
        verify(cloudStorageAdapter).deleteFile("ref123");
    }

    @Test
    void deleteSignature_exception_returnsFalse() throws Exception {
        doThrow(new IOException("Delete failed")).when(cloudStorageAdapter).deleteFile("ref123");

        assertFalse(service.deleteSignature("ref123"));
    }
}
