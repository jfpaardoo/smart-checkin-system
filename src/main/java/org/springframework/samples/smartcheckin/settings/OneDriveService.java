package org.springframework.samples.smartcheckin.settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.UUID;

@Service
@SuppressWarnings("null")
public class OneDriveService {

    private static final String SAFE_CHARS_REGEX = "[\\\\/:*?\"<>|~#%&{}]";

    private final CloudSettingsService cloudSettingsService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public OneDriveService(CloudSettingsService cloudSettingsService) {
        this.cloudSettingsService = cloudSettingsService;
    }

    private String getAccessToken(CloudSettings settings) {
        String tenantId = settings.getOneDriveTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = "common";
        }
        String sanitizedTenant = tenantId.replaceAll("[^a-zA-Z0-9-_.]", "");
        
        URI tokenUri = UriComponentsBuilder
                .fromUriString("https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token")
                .buildAndExpand(sanitizedTenant)
                .toUri();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", settings.getOneDriveClientId());
        body.add("client_secret", settings.getOneDriveClientSecret());
        body.add("refresh_token", settings.getOneDriveRefreshToken());
        body.add("grant_type", "refresh_token");
        body.add("scope", "offline_access files.readwrite");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(tokenUri, HttpMethod.POST, request, responseType);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("access_token")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive token endpoint");
        }
        return (String) bodyRes.get("access_token");
    }

    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            throw new IllegalStateException("OneDrive credentials not configured");
        }

        String accessToken = getAccessToken(settings);

        String originalFilename = file.getOriginalFilename();
        String safeOriginalName = originalFilename != null ? originalFilename.replaceAll(SAFE_CHARS_REGEX, "_") : "file";
        String uniqueFileName = UUID.randomUUID().toString() + "_" + safeOriginalName;

        String cleanFolderName = folderName != null ? folderName.replaceAll(SAFE_CHARS_REGEX, "_").trim() : "general";
        if (cleanFolderName.isEmpty()) {
            cleanFolderName = "general";
        }

        // Construcción segura de la URL usando plantillas de UriComponentsBuilder para evitar Path Traversal
        URI uploadUri = UriComponentsBuilder
                .fromUriString("https://graph.microsoft.com/v1.0/me/drive/root:/formations/{folder}/{filename}:/content")
                .buildAndExpand(cleanFolderName, uniqueFileName)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> request = new HttpEntity<>(file.getBytes(), headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(uploadUri, HttpMethod.PUT, request, responseType);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("id")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive upload endpoint");
        }
        String itemId = (String) bodyRes.get("id");

        return createShareLink(itemId, accessToken);
    }

    private String createShareLink(String itemId, String accessToken) {
        String safeItemId = itemId != null ? itemId.replaceAll("[^a-zA-Z0-9-_]", "") : "";
        
        URI linkUri = UriComponentsBuilder
                .fromUriString("https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink")
                .buildAndExpand(safeItemId)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"type\":\"view\",\"scope\":\"anonymous\"}";
        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(linkUri, HttpMethod.POST, request, responseType);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("link")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive createLink endpoint");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> linkData = (Map<String, Object>) bodyRes.get("link");
        return linkData != null ? (String) linkData.get("webUrl") : null;
    }

    public String uploadBackup(byte[] data, String fileName) {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            throw new IllegalStateException("OneDrive credentials not configured");
        }

        String accessToken = getAccessToken(settings);

        String safeFileName = fileName != null ? fileName.replaceAll(SAFE_CHARS_REGEX, "_") : "backup.zip";
        
        URI uploadUri = UriComponentsBuilder
                .fromUriString("https://graph.microsoft.com/v1.0/me/drive/root:/backups/{filename}:/content")
                .buildAndExpand(safeFileName)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> request = new HttpEntity<>(data, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(uploadUri, HttpMethod.PUT, request, responseType);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("id")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive upload endpoint");
        }
        String itemId = (String) bodyRes.get("id");

        return createShareLink(itemId, accessToken);
    }
}