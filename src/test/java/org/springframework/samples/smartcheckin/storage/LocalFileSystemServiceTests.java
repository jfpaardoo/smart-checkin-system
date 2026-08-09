package org.springframework.samples.smartcheckin.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

@SuppressWarnings("null")
class LocalFileSystemServiceTests {

    private static final String TEST_CONTEXT = "testContext";

    private LocalFileSystemService service;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        service = new LocalFileSystemService();
        // Inyecta el directorio temporal para no ensuciar el FS de tu máquina
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.resolve("uploads").toString());
        service.init();
    }

    @Test
    void testInitCreatesDirectory() {
        assertTrue(Files.exists(tempDir.resolve("uploads")));
    }

    @Test
    void testSaveSignatureNullOrEmpty() {
        assertNull(service.saveSignature(null, TEST_CONTEXT));
        assertNull(service.saveSignature("   ", TEST_CONTEXT));
    }

    @Test
    void testSaveSignatureFileTooLarge() {
        String hugeString = "a".repeat(700001); // Límite en 700000
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.saveSignature(hugeString, TEST_CONTEXT));
        assertTrue(ex.getMessage().contains("exceeds maximum limit"));
    }

    @Test
    void testSaveSignatureInvalidMimeType() {
        String invalidPrefix = "data:image/gif;base64,VGhpcyBpcyBhIHRlc3Q=";
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.saveSignature(invalidPrefix, TEST_CONTEXT));
        assertTrue(ex.getMessage().contains("Invalid signature image format"));
    }

    @Test
    void testSaveSignatureInvalidMagicBytesPayload() {
        // Bytes que no corresponden ni a PNG ni a JPEG
        byte[] fakeBytes = new byte[] { 0x00, 0x00, 0x00, 0x00 };
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(fakeBytes);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.saveSignature(base64, TEST_CONTEXT));
        assertTrue(ex.getMessage().contains("Payload magic bytes do not match"));
    }

    @Test
    void testSaveSignatureInvalidPayloadSize() {
        byte[] tinyBytes = new byte[] { 0x00, 0x01 };
        String base64 = Base64.getEncoder().encodeToString(tinyBytes);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.saveSignature(base64, TEST_CONTEXT));
        assertTrue(ex.getMessage().contains("Invalid image byte payload"));
    }

    @Test
    void testSaveSignatureValidPng() {
        // Cabecera válida PNG: 89 50 4E 47
        byte[] pngBytes = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x00, 0x00 };
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);

        String fileName = service.saveSignature(base64, TEST_CONTEXT);
        assertNotNull(fileName);
        assertTrue(fileName.endsWith(".png"));
    }

    @Test
    void testSaveSignatureValidJpeg() {
        // Cabecera válida JPEG: FF D8 FF
        byte[] jpegBytes = new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x00 };
        String base64 = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(jpegBytes);

        String fileName = service.saveSignature(base64, TEST_CONTEXT);
        assertNotNull(fileName);
        assertTrue(fileName.endsWith(".jpg"));
    }

    @Test
    void testLoadSignatureSuccessAndFailure() {
        byte[] pngBytes = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x00 };
        String fileName = service.saveSignature(Base64.getEncoder().encodeToString(pngBytes), TEST_CONTEXT);

        byte[] loaded = service.loadSignature(fileName);
        assertTrue(loaded.length > 0);

        byte[] notFound = service.loadSignature("non_existent_file.png");
        assertEquals(0, notFound.length);
    }

    @Test
    void testDeleteSignature() {
        byte[] pngBytes = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x00 };
        String fileName = service.saveSignature(Base64.getEncoder().encodeToString(pngBytes), TEST_CONTEXT);

        assertTrue(service.deleteSignature(fileName));
        assertFalse(service.deleteSignature(fileName));
    }

    @Test
    void testInitDirectoryAlreadyExists() {
        // Vuelve a llamar a init() para cubrir la rama falsa de Files.exists()
        assertDoesNotThrow(() -> service.init());
    }

    @Test
    void testSaveSignatureWithoutCommaPrefix() {
        // Base64 puro sin cabecera "data:image/png;base64," para cubrir la rama donde
        // base64Data.contains(",") es falso
        byte[] pngBytes = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x00, 0x00 };
        String pureBase64 = Base64.getEncoder().encodeToString(pngBytes);

        String fileName = service.saveSignature(pureBase64, TEST_CONTEXT);
        assertNotNull(fileName);
        assertTrue(fileName.endsWith(".png"));
    }

    @Test
    void testLoadSignatureFileNotFound() {
        byte[] result = service.loadSignature("archivo_inexistente.png");
        assertNotNull(result);
        assertEquals(0, result.length);
    }
}