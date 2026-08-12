package org.springframework.samples.smartcheckin.settings.adapter;

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
import org.springframework.samples.smartcheckin.settings.CloudSettings;
import org.springframework.samples.smartcheckin.settings.CloudSettingsService;

import java.util.Map;

import lombok.extern.slf4j.Slf4j;

import org.jpatterns.gof.AdapterPattern;

@Service
@AdapterPattern.Adapter
@Slf4j
@SuppressWarnings("null")
public class OneDriveAdapterImpl implements CloudStorageAdapter {

    private static final String SAFE_CHARS_REGEX = "[\\\\/:*?\"<>|~#%&{}]";

    private final CloudSettingsService cloudSettingsService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public OneDriveAdapterImpl(CloudSettingsService cloudSettingsService) {
        this.cloudSettingsService = cloudSettingsService;
    }

    private String getAccessToken(CloudSettings settings) {
        String tenantId = settings.getOneDriveTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = "common";
        }
        
        String tokenUrl = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token";
        
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
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                tokenUrl, HttpMethod.POST, request, responseType, tenantId);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("access_token")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive token endpoint");
        }
        return (String) bodyRes.get("access_token");
    }

    @Override
    public String uploadFile(MultipartFile file, String folderName) throws Exception {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            throw new IllegalStateException("OneDrive credentials not configured");
        }

        String accessToken = getAccessToken(settings);

        String originalFilename = file.getOriginalFilename();
        String safeFileName = originalFilename != null ? originalFilename.replaceAll(SAFE_CHARS_REGEX, "_") : "file";

        String cleanFolderName = folderName != null ? folderName.replaceAll(SAFE_CHARS_REGEX, "_").trim() : "general";
        if (cleanFolderName.isEmpty()) {
            cleanFolderName = "general";
        }

        String uploadUrl = "https://graph.microsoft.com/v1.0/me/drive/root:/ba/formations/{folder}/documents/{filename}:/content";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> request = new HttpEntity<>(file.getBytes(), headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                uploadUrl, HttpMethod.PUT, request, responseType, cleanFolderName, safeFileName);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("id")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive upload endpoint");
        }
        String itemId = (String) bodyRes.get("id");

        String shareLink = createShareLink(itemId, accessToken);
        
        return originalFilename + "||" + shareLink + "||" + itemId;
    }

    private String createShareLink(String itemId, String accessToken) {
        String linkUrl = "https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/createLink";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"type\":\"view\",\"scope\":\"anonymous\"}";
        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                linkUrl, HttpMethod.POST, request, responseType, itemId);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("link")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive createLink endpoint");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> linkData = (Map<String, Object>) bodyRes.get("link");
        return linkData != null ? (String) linkData.get("webUrl") : null;
    }

    @Override
    public String uploadBackup(byte[] data, String fileName) throws Exception {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            throw new IllegalStateException("OneDrive credentials not configured");
        }

        String accessToken = getAccessToken(settings);
        String safeFileName = fileName != null ? fileName.replaceAll(SAFE_CHARS_REGEX, "_") : "backup.zip";
        
        String uploadUrl = "https://graph.microsoft.com/v1.0/me/drive/root:/ba/backups/{filename}:/content";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> request = new HttpEntity<>(data, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                uploadUrl, HttpMethod.PUT, request, responseType, safeFileName);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("id")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive upload endpoint");
        }
        String itemId = (String) bodyRes.get("id");

        return createShareLink(itemId, accessToken);
    }

    @Override
    public String uploadSignature(byte[] data, String fileName, String pathContext) throws Exception {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            throw new IllegalStateException("OneDrive credentials not configured");
        }

        String accessToken = getAccessToken(settings);
        String safeFileName = fileName != null ? fileName.replaceAll(SAFE_CHARS_REGEX, "_") : "signature.png";
        
        // Clean pathContext and construct URL, allowing slashes to maintain subfolder structure
        String safePathContext = pathContext != null ? pathContext.replaceAll("[\\\\:*?\"<>|~#%&{}]", "_").trim() : "checkins";
        String uploadUrl = "https://graph.microsoft.com/v1.0/me/drive/root:/ba/{pathContext}/signatures/{filename}:/content";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> request = new HttpEntity<>(data, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                uploadUrl, HttpMethod.PUT, request, responseType, safePathContext, safeFileName);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null || !bodyRes.containsKey("id")) {
            throw new IllegalStateException("Empty or invalid response from OneDrive upload endpoint");
        }
        return (String) bodyRes.get("id"); // Returns itemId for storage reference
    }

    @Override
    public byte[] downloadFile(String itemId) throws Exception {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            throw new IllegalStateException("OneDrive credentials not configured");
        }

        String accessToken = getAccessToken(settings);
        String downloadUrl = "https://graph.microsoft.com/v1.0/me/drive/items/{itemId}/content";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    downloadUrl, HttpMethod.GET, request, byte[].class, itemId);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error downloading file from OneDrive: {}", e.getMessage());
            return new byte[0];
        }
    }

    @Override
    public void deleteFile(String fileIdOrUrl) throws Exception {
        if (fileIdOrUrl == null || fileIdOrUrl.trim().isEmpty()) {
            return;
        }

        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            return;
        }

        try {
            String accessToken = getAccessToken(settings);
            
            String fileId = fileIdOrUrl.trim();
            if (fileIdOrUrl.contains("||")) {
                String[] parts = fileIdOrUrl.split("\\|\\|");
                if (parts.length >= 3 && parts[2] != null && !parts[2].trim().isEmpty()) {
                    fileId = parts[2].trim();
                } else if (parts.length >= 2 && parts[1] != null && !parts[1].trim().isEmpty()) {
                    fileId = parts[1].trim();
                } else if (parts.length >= 1 && parts[0] != null && !parts[0].trim().isEmpty()) {
                    fileId = parts[0].trim();
                }
            }

            if (fileId.startsWith("http://") || fileId.startsWith("https://")) {
                log.warn("Advertencia: No se puede eliminar el archivo de OneDrive directamente con una URL web sin itemId: " + fileId);
                return;
            }

            String deleteUrl = "https://graph.microsoft.com/v1.0/me/drive/items/{fileId}";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.exchange(deleteUrl, HttpMethod.DELETE, request, Void.class, fileId);
        } catch (Exception e) {
            log.warn("Advertencia: No se pudo eliminar el archivo en OneDrive: " + e.getMessage());
        }
    }
}
