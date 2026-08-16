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

    private static final String TEST_TXT = "test.txt";
    private static final String TEXT_PLAIN = "text/plain";
    private static final String CONTENT = "content";
    private static final String FOLDER = "folder";
    private static final String CLIENT_ID = "client_id";
    private static final String SECRET = "secret";
    private static final String REFRESH = "refresh";
    private static final String TENANT = "tenant";
    private static final String ACCESS_TOKEN = "access_token";
    private static final String TOKEN_123 = "token123";
    private static final String TOKEN_URL = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token";
    private static final String ITEM_123 = "item123";
    private static final String WEB_URL = "webUrl";
    private static final String ONEDRIVE_LINK_TEST = "http://onedrive.link/test";
    private static final String CREATE_LINK_URL = "https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink";
    private static final String FILE_INFO_STRING = "test.txt||http://onedrive.link/test||item123";
    private static final String BACKUP_ITEM_123 = "backupItem123";
    private static final String BACKUP_ZIP = "backup.zip";
    private static final String ONEDRIVE_LINK_BACKUP = "http://onedrive.link/backup";
    private static final String DRIVE_ITEM_URL = "https://graph.microsoft.com/v1.0/me/drive/items/{fileId}";
    private static final String TEST_DATA = "test data";
    private static final String ERROR_ITEM = "errorItem";

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
        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());

        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, FOLDER));
    }

    @Test
    void testUploadFileSuccess() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveClientSecret(SECRET);
        settings.setOneDriveRefreshToken(REFRESH);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", ITEM_123);
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/ba/formations/{folder}/documents/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(FOLDER),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of(WEB_URL, ONEDRIVE_LINK_TEST));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq(CREATE_LINK_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(ITEM_123)
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        String result = oneDriveAdapterImpl.uploadFile(file, FOLDER);

        assertEquals(FILE_INFO_STRING, result);
    }

    @Test
    void testUploadBackupSuccess() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveClientSecret(SECRET);
        settings.setOneDriveRefreshToken(REFRESH);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", BACKUP_ITEM_123);
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/ba/backups/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(BACKUP_ZIP)
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of(WEB_URL, ONEDRIVE_LINK_BACKUP));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq(CREATE_LINK_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(BACKUP_ITEM_123)
        )).thenReturn(linkEntity);

        String result = oneDriveAdapterImpl.uploadBackup("data".getBytes(), BACKUP_ZIP);

        assertEquals(ONEDRIVE_LINK_BACKUP, result);
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
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveTenantId(null);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(Map.of(), HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("common")
        )).thenReturn(tokenEntity);

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, ""));
    }

    @Test
    void testUploadFileWithNullFolder() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
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

        MockMultipartFile file = new MockMultipartFile("file", (String)null, TEXT_PLAIN, CONTENT.getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, null));
    }

    @Test
    void testDeleteFileNoSettings() throws Exception {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        oneDriveAdapterImpl.deleteFile(ITEM_123);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void testDeleteFileSuccess() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveClientSecret(SECRET);
        settings.setOneDriveRefreshToken(REFRESH);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        when(restTemplate.exchange(
                eq(DRIVE_ITEM_URL),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq(ITEM_123)
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        assertDoesNotThrow(() -> oneDriveAdapterImpl.deleteFile(FILE_INFO_STRING));
        
        verify(restTemplate, times(1)).exchange(
                eq(DRIVE_ITEM_URL),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq(ITEM_123)
        );
    }

    @Test
    void testDeleteFileExceptionHandled() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveClientSecret(SECRET);
        settings.setOneDriveRefreshToken(REFRESH);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        when(restTemplate.exchange(
                eq(DRIVE_ITEM_URL),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<Class<Void>>eq(Void.class),
                (Object) eq(ERROR_ITEM)
        )).thenThrow(new RestClientException("Graph API Error"));

        assertDoesNotThrow(() -> oneDriveAdapterImpl.deleteFile(ERROR_ITEM));
    }

    @Test
    void testDownloadFileSuccess() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveClientSecret(SECRET);
        settings.setOneDriveRefreshToken(REFRESH);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        byte[] expectedBytes = "downloaded content".getBytes();
        ResponseEntity<byte[]> downloadEntity = new ResponseEntity<>(expectedBytes, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/content"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(byte[].class),
                (Object) eq(ITEM_123)
        )).thenReturn(downloadEntity);

        byte[] result = oneDriveAdapterImpl.downloadFile(ITEM_123);
        assertArrayEquals(expectedBytes, result);
    }

    @Test
    void testDownloadFileExceptionHandled() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveClientSecret(SECRET);
        settings.setOneDriveRefreshToken(REFRESH);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/content"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(byte[].class),
                (Object) eq(ERROR_ITEM)
        )).thenThrow(new RestClientException("Download failed"));

        byte[] result = oneDriveAdapterImpl.downloadFile(ERROR_ITEM);
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    @Test
    void testUploadBackupNoSettings() {
        when(cloudSettingsService.getSettings()).thenReturn(null);
        byte[] data = TEST_DATA.getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadBackup(data, "test.zip"));
    }

    @Test
    void testUploadBackupNoClientId() {
        CloudSettings settings = new CloudSettings();
        when(cloudSettingsService.getSettings()).thenReturn(settings);
        byte[] data = TEST_DATA.getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadBackup(data, "test.zip"));
    }

    @Test
    void testUploadBackupWithNullFileName() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveClientSecret(SECRET);
        settings.setOneDriveRefreshToken(REFRESH);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", ITEM_123);
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                eq("https://graph.microsoft.com/v1.0/me/drive/root:/ba/formations/{folder}/documents/{filename}:/content"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(FOLDER),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        ResponseEntity<Map<String, Object>> emptyLinkEntity = new ResponseEntity<>(Map.of(), HttpStatus.OK);
        when(restTemplate.exchange(
                eq(CREATE_LINK_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(ITEM_123)
        )).thenReturn(emptyLinkEntity);

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, FOLDER));
    }

    @Test
    void testUploadFileWithWhitespaceTenantId() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveTenantId("   "); 
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("common")
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", ITEM_123);
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(FOLDER),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of(WEB_URL, ONEDRIVE_LINK_TEST));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(ITEM_123)
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        String result = oneDriveAdapterImpl.uploadFile(file, FOLDER);
        assertEquals(FILE_INFO_STRING, result);
    }

    @Test
    void testUploadFileWithRegexCharactersInFilenamesAndFolder() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        settings.setOneDriveTenantId(TENANT);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(TENANT)
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", ITEM_123);
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("b_d_f_lder"),
                (Object) eq("b_d_f_le.txt")
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of(WEB_URL, ONEDRIVE_LINK_TEST));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq(ITEM_123)
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", "b<d>f|le.txt", TEXT_PLAIN, CONTENT.getBytes());
        String result = oneDriveAdapterImpl.uploadFile(file, "b\\d/f*lder");
        assertEquals("b<d>f|le.txt||http://onedrive.link/test||item123", result);
    }

    @Test
    void testUploadFileWithEmptyTrimmedFolderName() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", ITEM_123);
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("general"),
                (Object) anyString()
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of(WEB_URL, ONEDRIVE_LINK_TEST));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) eq(ITEM_123)
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        String result = oneDriveAdapterImpl.uploadFile(file, "   ");
        assertEquals(FILE_INFO_STRING, result);
    }

    @Test
    void testCreateShareLinkWithNullLinkData() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", ITEM_123);
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
                (Object) eq(ITEM_123)
        )).thenReturn(linkEntity);

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        String result = oneDriveAdapterImpl.uploadFile(file, FOLDER);
        assertEquals("test.txt||null||item123", result);
    }

    @Test
    void testCreateShareLinkEmptyResponse() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) anyString()
        )).thenReturn(tokenEntity);

        Map<String, Object> uploadResponse = Map.of("id", BACKUP_ITEM_123);
        ResponseEntity<Map<String, Object>> uploadEntity = new ResponseEntity<>(uploadResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                (Object) eq("back_up.zip")
        )).thenReturn(uploadEntity);

        Map<String, Object> linkResponse = Map.of("link", Map.of(WEB_URL, ONEDRIVE_LINK_BACKUP));
        ResponseEntity<Map<String, Object>> linkEntity = new ResponseEntity<>(linkResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(), 
                eq(HttpMethod.POST), 
                any(HttpEntity.class), 
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(), 
                (Object) eq(BACKUP_ITEM_123)
        )).thenReturn(linkEntity);

        String result = oneDriveAdapterImpl.uploadBackup("data".getBytes(), "back*up.zip");
        assertEquals(ONEDRIVE_LINK_BACKUP, result);
    }

    @Test
    void testUploadFileWithWhitespaceTenantId2() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
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
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
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
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
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
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        ResponseEntity<Map<String, Object>> tokenEntity = new ResponseEntity<>(null, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map<String, Object>>>any(),
                anyString()
        )).thenReturn(tokenEntity);

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, FOLDER));
    }

    @Test
    void testUploadBackupWithRegexFileName() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
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

        MockMultipartFile file = new MockMultipartFile("file", TEST_TXT, TEXT_PLAIN, CONTENT.getBytes());
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadFile(file, FOLDER));
    }

    @Test
    void testDeleteFileWithOnlyFirstPartInUrl() throws Exception {
        CloudSettings settings = new CloudSettings();
        settings.setOneDriveClientId(CLIENT_ID);
        when(cloudSettingsService.getSettings()).thenReturn(settings);

        Map<String, Object> tokenResponse = Map.of(ACCESS_TOKEN, TOKEN_123);
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

        byte[] data = TEST_DATA.getBytes();
        assertThrows(IllegalStateException.class, () -> oneDriveAdapterImpl.uploadBackup(data, BACKUP_ZIP));
    }
}
