package org.springframework.samples.smartcheckin.settings;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@SuppressWarnings("null")
class OneDriveServiceTests {

    private CloudSettingsService cloudSettingsService;
    private RestTemplate restTemplate;
    private OneDriveService oneDriveService;

    @BeforeEach
    void setUp() {
        cloudSettingsService = mock(CloudSettingsService.class);
        restTemplate = mock(RestTemplate.class);
        oneDriveService = new OneDriveService(cloudSettingsService);
        ReflectionTestUtils.setField(oneDriveService, "restTemplate", restTemplate);
    }

    @Test
    void testUploadFileWithoutSettings() {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadFile(file, "folder"));
    }

    @SuppressWarnings("unchecked")
    @Test
    void testUploadFileSuccess() throws IOException {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveClientSecret("secret");
        settings.setOneDriveRefreshToken("refresh");
        settings.setOneDriveTenantId("tenant");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("tenant")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/formations/{folder}/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("folder"),
                anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/test"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("item123")
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        String result = oneDriveService.uploadFile(file, "folder");

        assertEquals("test.txt||http://onedrive.link/test||item123", result);
    }

    @SuppressWarnings("unchecked")
    @Test
    void testUploadBackupSuccess() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveClientSecret("secret");
        settings.setOneDriveRefreshToken("refresh");
        settings.setOneDriveTenantId("tenant");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("tenant")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "backupItem123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/backups/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("backup.zip")
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/backup"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("backupItem123")
        )).thenReturn(linkEntity);

        String result = oneDriveService.uploadBackup("data".getBytes(), "backup.zip");

        assertEquals("http://onedrive.link/backup", result);
    }

    @Test
    void testDeleteFileNullOrBlank() {
        oneDriveService.deleteFile(null);
        oneDriveService.deleteFile("   ");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void testDeleteFileWithoutSettings() {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        oneDriveService.deleteFile("item123");
        verifyNoInteractions(restTemplate);
    }

    @SuppressWarnings("unchecked")
    @Test
    void testDeleteFileSuccess() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveClientSecret("secret");
        settings.setOneDriveRefreshToken("refresh");
        settings.setOneDriveTenantId("tenant");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("tenant")
        )).thenReturn(tokenEntity);

        // Usamos eq("item123") directamente en lugar de varargs ambiguos
        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{fileId}"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                eq(Void.class),
                eq("item123")
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        assertDoesNotThrow(() -> oneDriveService.deleteFile("test.txt||http://onedrive.link/test||item123"));
        
        verify(restTemplate, times(1)).exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{fileId}"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                eq(Void.class),
                eq("item123")
        );
    }

    @SuppressWarnings("unchecked")
    @Test
    void testDeleteFileExceptionHandled() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveClientSecret("secret");
        settings.setOneDriveRefreshToken("refresh");
        settings.setOneDriveTenantId("tenant");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class),
                eq("tenant")
        )).thenReturn(tokenEntity);

        // Usamos eq("errorItem") explícitamente para evitar ambigüedades con varargs
        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{fileId}"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                eq(Void.class),
                eq("errorItem")
        )).thenThrow(new RestClientException("Graph API Error"));

        assertDoesNotThrow(() -> oneDriveService.deleteFile("errorItem"));
    }
}