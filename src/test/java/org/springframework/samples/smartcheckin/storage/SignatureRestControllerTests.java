package org.springframework.samples.smartcheckin.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class SignatureRestControllerTests {

    private LocalFileSystemService localFileSystemService;
    private SignatureRestController controller;

    @BeforeEach
    void setUp() {
        localFileSystemService = mock(LocalFileSystemService.class);
        controller = new SignatureRestController(localFileSystemService);
    }

    @Test
    void testGetSignatureFound() {
        byte[] mockImage = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
        when(localFileSystemService.loadSignature("valid.png")).thenReturn(mockImage);

        ResponseEntity<byte[]> response = controller.getSignature("valid.png");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(4, response.getBody().length);
    }

    @Test
    void testGetSignatureNotFoundNull() {
        when(localFileSystemService.loadSignature("invalid.png")).thenReturn(null);

        ResponseEntity<byte[]> response = controller.getSignature("invalid.png");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testGetSignatureNotFoundEmpty() {
        when(localFileSystemService.loadSignature("empty.png")).thenReturn(new byte[0]);

        ResponseEntity<byte[]> response = controller.getSignature("empty.png");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
    
    @Test
    void testGetSignaturePathTraversalSanitization() {
        when(localFileSystemService.loadSignature("file.png")).thenReturn(new byte[0]);
        
        // El input malicioso "../file.png" debería sanearse a ".file.png"
        controller.getSignature("../file.png");
        verify(localFileSystemService).loadSignature("..file.png");
    }
}