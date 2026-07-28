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

import java.io.IOException;

import java.util.Map;
import java.util.UUID;

@Service
@SuppressWarnings("null")
public class OneDriveService {

    private final CloudSettingsService cloudSettingsService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public OneDriveService(CloudSettingsService cloudSettingsService) {
        this.cloudSettingsService = cloudSettingsService;
    }

    private String getAccessToken(CloudSettings settings) {
        String tokenUrl = "https://login.microsoftonline.com/" + settings.getOneDriveTenantId() + "/oauth2/v2.0/token";
        
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
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, request, responseType);
        
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null) {
            throw new IllegalStateException("Empty response from OneDrive token endpoint");
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
        String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFilename;

        String cleanFolderName = folderName != null ? folderName.replaceAll("[\\\\/:*?\"<>|~#%&{}]", "_").trim() : "general";
        if (cleanFolderName.isEmpty()) {
            cleanFolderName = "general";
        }

        String uploadUrl = "https://graph.microsoft.com/v1.0/me/drive/root:/formations/" + cleanFolderName + "/" + uniqueFileName + ":/content";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> request = new HttpEntity<>(file.getBytes(), headers);

        org.springframework.core.ParameterizedTypeReference<Map<String, Object>> responseType = new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(uploadUrl, HttpMethod.PUT, request, responseType);
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null) {
            throw new IllegalStateException("Empty response from OneDrive upload endpoint");
        }
        String itemId = (String) bodyRes.get("id");

        return createShareLink(itemId, accessToken);
    }

    private String createShareLink(String itemId, String accessToken) {
        String linkUrl = "https://graph.microsoft.com/v1.0/me/drive/items/" + itemId + "/createLink";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"type\":\"view\",\"scope\":\"anonymous\"}";

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(linkUrl, HttpMethod.POST, request, responseType);
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null) {
            throw new IllegalStateException("Empty response from OneDrive createLink endpoint");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> linkData = (Map<String, Object>) bodyRes.get("link");
        return (String) linkData.get("webUrl");
    }

    public String uploadBackup(byte[] data, String fileName) {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null || settings.getOneDriveClientId() == null) {
            throw new IllegalStateException("OneDrive credentials not configured");
        }

        String accessToken = getAccessToken(settings);

        String uploadUrl = "https://graph.microsoft.com/v1.0/me/drive/root:/backups/" + fileName + ":/content";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> request = new HttpEntity<>(data, headers);

        ParameterizedTypeReference<Map<String, Object>> responseType = new ParameterizedTypeReference<Map<String, Object>>() {};
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(uploadUrl, HttpMethod.PUT, request, responseType);
        Map<String, Object> bodyRes = response.getBody();
        if (bodyRes == null) {
            throw new IllegalStateException("Empty response from OneDrive upload endpoint");
        }
        String itemId = (String) bodyRes.get("id");

        return createShareLink(itemId, accessToken);
    }

}
