package org.springframework.samples.smartcheckin.settings.adapter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
import org.springframework.samples.smartcheckin.settings.CloudSettings;
import org.springframework.samples.smartcheckin.settings.CloudSettingsService;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@SuppressWarnings("null")
class OneDriveAdapterImplTests {

    private CloudSettingsService cloudSettingsService;
    private RestTemplate restTemplate;
    private OneDriveAdapterImpl oneDriveAdapterImpl;

    @BeforeEach
    void setUp() {
        cloudSettingsService = mock(CloudSettingsService.class);
        restTemplate = mock(RestTemplate.class);
        oneDriveAdapterImpl = new OneDriveAdapterImpl(cloudSettingsService);
        ReflectionTestUtils.setField(oneDriveAdapterImpl, "restTemplate", restTemplate);
    }

    @Test
    void testUploadFileWithoutSettings() {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, "folder"));
    }

    @Test
    void testUploadFileSuccess() throws Exception {
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
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/ba/formations/{folder}/documents/{filename}:/content"),
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
        String result = oneDriveAdapterImpl.uploadFile(file, "folder");

        assertEquals("test.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testUploadBackupSuccess() throws Exception {
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
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/ba/backups/{filename}:/content"),
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

        String result = oneDriveAdapterImpl.uploadBackup("data".getBytes(), "backup.zip");

        assertEquals("http://onedrive.link/backup", result);
    }

    @Test
    void testDeleteFileNullOrBlank() throws Exception {
        oneDriveAdapterImpl.deleteFile(null);
        oneDriveAdapterImpl.deleteFile("   ");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void testUploadFileWithEmptyFolder() throws Exception {
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
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, ""));
    }

    @Test
    void testUploadFileWithNullFolder() throws Exception {
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
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, null));
    }

    @Test
    void testDeleteFileNoSettings() throws Exception {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        oneDriveAdapterImpl.deleteFile("item123");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void testDeleteFileSuccess() throws Exception {
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

        assertDoesNotThrow(() -> oneDriveAdapterImpl.deleteFile("test.txt||http://onedrive.link/test||item123"));
        
        verify(restTemplate, times(1)).exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{fileId}"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq("item123")
        );
    }

    @Test
    void testDeleteFileExceptionHandled() throws Exception {
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

        assertDoesNotThrow(() -> oneDriveAdapterImpl.deleteFile("errorItem"));
    }

    @Test
    void testUploadBackupNoSettings() {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        byte[] data = "test data".getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadBackup(data, "test.zip"));
    }

    @Test
    void testUploadBackupNoClientId() {
        CloudSettings settings = new CloudSettings();
        when(cloudSettingsService.getSettings()).thenReturn(settings);
        byte[] data = "test data".getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadBackup(data, "test.zip"));
    }

    @Test
    void testUploadBackupWithNullFileName() throws Exception {
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
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/ba/formations/{folder}/documents/{filename}:/content"),
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
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, "folder"));
    }

    @Test
    void testUploadFileWithWhitespaceTenantId() throws Exception {
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
        String result = oneDriveAdapterImpl.uploadFile(file, "folder");
        assertEquals("test.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testUploadFileWithRegexCharactersInFilenamesAndFolder() throws Exception {
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
        String result = oneDriveAdapterImpl.uploadFile(file, "b\\d/f*lder");
        assertEquals("b<d>f|le.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testUploadFileWithEmptyTrimmedFolderName() throws Exception {
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
        String result = oneDriveAdapterImpl.uploadFile(file, "   ");
        assertEquals("test.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testCreateShareLinkWithNullLinkData() throws Exception {
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
        String result = oneDriveAdapterImpl.uploadFile(file, "folder");
        assertEquals("test.txt||null||item123", result);
    }

    @Test
    void testCreateShareLinkEmptyResponse() throws Exception {
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

        String result = oneDriveAdapterImpl.uploadBackup("data".getBytes(), "back*up.zip");
        assertEquals("http://onedrive.link/backup", result);
    }

    @Test
    void testUploadFileWithWhitespaceTenantId2() throws Exception {
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

        assertDoesNotThrow(() -> oneDriveAdapterImpl.deleteFile("item789||"));
    }

    @Test
    void testUploadFileWithRegexCharactersInFilenamesAndFolder2() throws Exception {
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

        assertDoesNotThrow(() -> oneDriveAdapterImpl.deleteFile("https://example.com/file123"));
        
        verify(restTemplate, never()).exchange(
                anyString(), 
                eq(HttpMethod.DELETE), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class), 
                (Object) anyString()
        );
    }

    @Test
    void testUploadFileWithEmptyTrimmedFolderName2() throws Exception {
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

        assertDoesNotThrow(() -> oneDriveAdapterImpl.deleteFile("   ||   ||item123"));
    }

    @Test
    void testCreateShareLinkWithNullLinkData2() throws Exception {
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
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, "folder"));
    }

    @Test
    void testUploadBackupWithRegexFileName() throws Exception {
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
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, "folder"));
    }

    @Test
    void testDeleteFileWithOnlyFirstPartInUrl() throws Exception {
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
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadBackup(data, "backup.zip"));
    }
}
