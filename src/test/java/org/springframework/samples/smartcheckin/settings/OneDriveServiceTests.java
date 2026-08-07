package org.springframework.samples.smartcheckin.settings;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
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
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/formations/{folder}/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("folder"),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/test"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("item123")
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        String result = oneDriveService.uploadFile(file, "folder");

        assertEquals("test.txt||http://onedrive.link/test||item123", result);
    }

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
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "backupItem123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/backups/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("backup.zip")
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/backup"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("backupItem123")
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
    void testUploadFileInvalidTokenResponse() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveTenantId(null);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(Map.of(), HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("common")
        )).thenReturn(tokenEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadFile(file, ""));
    }

    @Test
    void testUploadFileInvalidUploadResponse() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveTenantId("tenant");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(Map.of(), HttpStatus.OK);

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) anyString(),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        MockMultipartFile file = new MockMultipartFile("file", (String)null, "text/plain", "content".getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadFile(file, null));
    }

    @Test
    void testDeleteFileWithoutSettings() {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        oneDriveService.deleteFile("item123");
        verifyNoInteractions(restTemplate);
    }

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
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{fileId}"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq("item123")
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        assertDoesNotThrow(() -> oneDriveService.deleteFile("test.txt||http://onedrive.link/test||item123"));
        
        verify(restTemplate, times(1)).exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{fileId}"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq("item123")
        );
    }

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
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{fileId}"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq("errorItem")
        )).thenThrow(new RestClientException("Graph API Error"));

        assertDoesNotThrow(() -> oneDriveService.deleteFile("errorItem"));
    }

    @Test
    void testUploadBackupFailsWhenNoSettings() {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        byte[] data = "test data".getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadBackup(data, "test.zip"));
    }

    @Test
    void testUploadBackupFailsWhenNoClientId() {
        CloudSettings settings = new CloudSettings();
        when(cloudSettingsService.getSettings()).thenReturn(settings);
        byte[] data = "test data".getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadBackup(data, "test.zip"));
    }

    @Test
    void testUploadBackupWithNullFileName() {
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
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/backups/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("backup.zip")
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/test"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("item123")
        )).thenReturn(linkEntity);

        String result = oneDriveService.uploadBackup("test data".getBytes(), null);
        assertEquals("http://onedrive.link/test", result);
    }

    @Test
    void testCreateShareLinkEmptyResponse() {
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
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/formations/{folder}/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("folder"),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        ResponseEntity<Map<String, Object>> emptyLinkEntity = new ResponseEntity<>(Map.of(), HttpStatus.OK);
        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("item123")
        )).thenReturn(emptyLinkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadFile(file, "folder"));
    }

    @Test
    void testUploadFileWithWhitespaceTenantId() throws IOException {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveTenantId("   "); 
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                eq("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("common")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("folder"),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/test"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("item123")
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        String result = oneDriveService.uploadFile(file, "folder");
        assertEquals("test.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testUploadFileWithRegexCharactersInFilenamesAndFolder() throws IOException {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        settings.setOneDriveTenantId("tenant");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("tenant")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("b_d_f_lder"),
                (Object) eq("b_d_f_le.txt")
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/test"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("item123")
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "b<d>f|le.txt", "text/plain", "content".getBytes());
        String result = oneDriveService.uploadFile(file, "b\\d/f*lder");
        assertEquals("b<d>f|le.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testUploadFileWithEmptyTrimmedFolderName() throws IOException {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("general"),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/test"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) eq("item123")
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        String result = oneDriveService.uploadFile(file, "   ");
        assertEquals("test.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testCreateShareLinkWithNullLinkData() throws IOException {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "item123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.PUT), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString(), 
                (Object) anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = new HashMap<>();
        linkResponse.put("link", null); 
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) eq("item123")
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        String result = oneDriveService.uploadFile(file, "folder");
        assertEquals("test.txt||null||item123", result);
    }

    @Test
    void testUploadBackupWithRegexFileName() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", "backupItem123");
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("back_up.zip")
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of("webUrl", "http://onedrive.link/backup"));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) eq("backupItem123")
        )).thenReturn(linkEntity);

        String result = oneDriveService.uploadBackup("data".getBytes(), "back*up.zip");
        assertEquals("http://onedrive.link/backup", result);
    }

    @Test
    void testDeleteFileWithOnlyFirstPartInUrl() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq("item789")
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        assertDoesNotThrow(() -> oneDriveService.deleteFile("item789||"));
    }

    @Test
    void testDeleteFileWithHttpsUrl() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        assertDoesNotThrow(() -> oneDriveService.deleteFile("https://example.com/file123"));
        
        verify(restTemplate, never()).exchange(
                anyString(), 
                eq(HttpMethod.DELETE), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class), 
                (Object) anyString()
        );
    }

    @Test
    void testDeleteFileWithEmptyPartsInUrl() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq("   ||   ||item123")
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        assertDoesNotThrow(() -> oneDriveService.deleteFile("   ||   ||item123"));
    }

    @Test
    void testUploadFileAccessTokenNullResponse() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(null, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                anyString()
        )).thenReturn(tokenEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadFile(file, "folder"));
    }

    @Test
    void testUploadFileNullUploadResponseEntityBody() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                anyString()
        )).thenReturn(tokenEntity);

        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(null, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                anyString(),
                anyString()
        )).thenReturn(uploadEntity);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadFile(file, "folder"));
    }

    @Test
    void testUploadBackupNullUploadResponse() {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId("client_id");
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of("access_token", "token123");
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                anyString()
        )).thenReturn(tokenEntity);

        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(null, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                anyString()
        )).thenReturn(uploadEntity);

        byte[] data = "test data".getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveService.uploadBackup(data, "backup.zip"));
    }
}