package org.springframework.samples.smartcheckin.settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cloud-settings")
@Slf4j
public class CloudSettingsRestController {

    private final CloudSettingsService cloudSettingsService;
    private final DatabaseBackupService databaseBackupService;

    @Value("${azure.client.id}")
    private String azureClientId;

    @Value("${azure.client.secret}")
    private String azureClientSecret;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Autowired
    public CloudSettingsRestController(CloudSettingsService cloudSettingsService, DatabaseBackupService databaseBackupService) {
        this.cloudSettingsService = cloudSettingsService;
        this.databaseBackupService = databaseBackupService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CloudSettingsDTO> getSettings() {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings == null) {
            settings = new CloudSettings();
            settings.setProvider("ONEDRIVE");
        }
        return ResponseEntity.ok(new CloudSettingsDTO(settings));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CloudSettingsDTO> saveSettings(@RequestBody CloudSettingsDTO settingsDto) {
        CloudSettings existing = cloudSettingsService.getSettings();
        CloudSettings toSave = settingsDto.toEntity(existing);
        CloudSettings savedSettings = cloudSettingsService.saveSettings(toSave);
        return ResponseEntity.ok(new CloudSettingsDTO(savedSettings));
    }

    @PostMapping("/backup")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> forceBackup() {
        try {
            databaseBackupService.createAndUploadBackup();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error forcing backup: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/oauth/authorize-url")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, String>> getAuthUrl(HttpServletRequest request) {
        String state = UUID.randomUUID().toString();
        String redirectUri = getDynamicRedirectUri(request);
        
        String url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize" +
                "?client_id=" + azureClientId +
                "&response_type=code" +
                "&redirect_uri=" + redirectUri +
                "&response_mode=query" +
                "&scope=offline_access Files.ReadWrite" +
                "&state=" + state;
                
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/oauth/callback")
    public void oauthCallback(@RequestParam String code, @RequestParam String state, 
                              HttpServletRequest request, HttpServletResponse response) throws IOException {
        
        RestTemplate restTemplate = new RestTemplate();
        String tokenUrl = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
        
        String redirectUri = getDynamicRedirectUri(request);
        String frontendSettingsUrl = getDynamicFrontendUrl(request);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", azureClientId);
        body.add("scope", "offline_access Files.ReadWrite");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");
        body.add("client_secret", azureClientSecret);
        
        HttpEntity<MultiValueMap<String, String>> httpRequest = new HttpEntity<>(body, headers);
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = restTemplate.postForObject(tokenUrl, httpRequest, Map.class);
            
            if (tokenResponse == null || !tokenResponse.containsKey("refresh_token")) {
                throw new IllegalStateException("Respuesta nula o inválida desde Microsoft");
            }
            
            String refreshToken = (String) tokenResponse.get("refresh_token");
            
            CloudSettings settings = cloudSettingsService.getSettings();
            if (settings == null) {
                settings = new CloudSettings();
            }
            
            settings.setProvider("ONEDRIVE");
            settings.setOneDriveClientId(azureClientId);
            settings.setOneDriveClientSecret(azureClientSecret);
            settings.setOneDriveTenantId("consumers");
            settings.setOneDriveRefreshToken(refreshToken);
            
            cloudSettingsService.saveSettings(settings);
            
            response.sendRedirect(frontendSettingsUrl + "?onedrive=connected");
            
        } catch (Exception e) {
            log.error("Error en el callback de OAuth2: ", e);
            response.sendRedirect(frontendSettingsUrl + "?onedrive=error");
        }
    }

    private String getDynamicRedirectUri(HttpServletRequest request) {
        String serverName = request.getServerName();
        if (serverName.contains("localhost") || serverName.contains("127.0.0.1")) {
            return "http://localhost:8080/api/v1/cloud-settings/oauth/callback";
        }
        return backendUrl + "/api/v1/cloud-settings/oauth/callback";
    }

    private String getDynamicFrontendUrl(HttpServletRequest request) {
        String serverName = request.getServerName();
        // Ruta exacta configurada en App.js de React
        String cloudSettingsPath = "/admin/cloud-settings"; 
        
        if (serverName.contains("localhost") || serverName.contains("127.0.0.1")) {
            return "http://localhost:3000" + cloudSettingsPath; 
        }
        return frontendUrl + cloudSettingsPath;
    }

    @DeleteMapping("/disconnect")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> disconnectOneDrive() {
        CloudSettings settings = cloudSettingsService.getSettings();
        if (settings != null) {
            settings.setOneDriveRefreshToken(null);
            settings.setOneDriveClientId(null);
            settings.setOneDriveClientSecret(null);
            settings.setOneDriveTenantId(null);
            cloudSettingsService.saveSettings(settings);
        }
        return ResponseEntity.ok().build();
    }
}