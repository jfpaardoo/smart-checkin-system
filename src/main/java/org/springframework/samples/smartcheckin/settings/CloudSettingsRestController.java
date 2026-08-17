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

    @Value("${azure.client.id:test-client-id}")
    private String azureClientId;

    @Value("${azure.client.secret:test-client-secret}")
    private String azureClientSecret;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.oauth.callback-path:/api/v1/cloud-settings/oauth/callback}")
    private String oauthCallbackPath;

    @Value("${app.oauth.frontend-settings-path:/admin/cloud-settings}")
    private String frontendSettingsPath;

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
    public ResponseEntity<Map<String, String>> getAuthUrl(jakarta.servlet.http.HttpServletRequest request) {
        String redirectUri = getDynamicRedirectUri(request);
        String frontendReturnUrl = getDynamicFrontendUrl(request);
        
        // Encode state with a UUID and base64 frontend return URL so callback redirects to correct host
        String encodedFrontend = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(frontendReturnUrl.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String state = UUID.randomUUID().toString() + "::" + encodedFrontend;
        
        String url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize" +
                "?client_id=" + azureClientId +
                "&response_type=code" +
                "&redirect_uri=" + java.net.URLEncoder.encode(redirectUri, java.nio.charset.StandardCharsets.UTF_8) +
                "&response_mode=query" +
                "&scope=" + java.net.URLEncoder.encode("offline_access Files.ReadWrite", java.nio.charset.StandardCharsets.UTF_8) +
                "&state=" + java.net.URLEncoder.encode(state, java.nio.charset.StandardCharsets.UTF_8);
                
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/oauth/callback")
    public void oauthCallback(@RequestParam String code, 
                              @RequestParam(required = false) String state, 
                              jakarta.servlet.http.HttpServletRequest request,
                              HttpServletResponse response) throws IOException {
        
        RestTemplate restTemplate = new RestTemplate();
        String tokenUrl = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
        
        String redirectUri = getDynamicRedirectUri(request);
        String frontendSettingsUrl = resolveFrontendUrlFromState(state, request);
        
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

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }
        int end = url.length();
        while (end > 0 && url.charAt(end - 1) == '/') {
            end--;
        }
        return url.substring(0, end);
    }

    private static boolean isNonLocalUrl(String url) {
        return url != null && !url.isBlank() && !url.contains("localhost") && !url.contains("127.0.0.1");
    }

    private String getBaseUriFromRequest(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null || scheme.isBlank()) {
            scheme = request.getScheme();
        }
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getHeader("Host");
        }
        if (host == null || host.isBlank()) {
            host = request.getServerName();
            int port = request.getServerPort();
            if (port > 0 && port != 80 && port != 443) {
                host += ":" + port;
            }
        }
        String contextPath = request.getContextPath() != null ? request.getContextPath() : "";
        return trimTrailingSlash(scheme + "://" + host + contextPath);
    }

    private String getDynamicRedirectUri(jakarta.servlet.http.HttpServletRequest request) {
        if (isNonLocalUrl(backendUrl)) {
            return trimTrailingSlash(backendUrl) + oauthCallbackPath;
        }
        String baseUri = getBaseUriFromRequest(request);
        if (!baseUri.isBlank()) {
            return baseUri + oauthCallbackPath;
        }
        return trimTrailingSlash(backendUrl) + oauthCallbackPath;
    }

    private String getDynamicFrontendUrl(jakarta.servlet.http.HttpServletRequest request) {
        if (isNonLocalUrl(frontendUrl)) {
            return trimTrailingSlash(frontendUrl) + frontendSettingsPath;
        }
        if (request != null) {
            String origin = request.getHeader("Origin");
            if (origin != null && !origin.isBlank()) {
                return trimTrailingSlash(origin) + frontendSettingsPath;
            }
            String referer = request.getHeader("Referer");
            if (referer != null && !referer.isBlank()) {
                try {
                    java.net.URI uri = new java.net.URI(referer);
                    return trimTrailingSlash(uri.getScheme() + "://" + uri.getAuthority()) + frontendSettingsPath;
                } catch (Exception e) {
                    log.debug("Referer header parsing skipped: {}", e.getMessage());
                }
            }
            String baseUri = getBaseUriFromRequest(request);
            if (!baseUri.isBlank()) {
                return baseUri + frontendSettingsPath;
            }
        }
        return trimTrailingSlash(frontendUrl) + frontendSettingsPath;
    }

    private String resolveFrontendUrlFromState(String state, jakarta.servlet.http.HttpServletRequest request) {
        if (state != null && state.contains("::")) {
            try {
                String[] parts = state.split("::", 2);
                if (parts.length > 1 && !parts[1].isBlank()) {
                    byte[] decoded = java.util.Base64.getUrlDecoder().decode(parts[1]);
                    String url = new String(decoded, java.nio.charset.StandardCharsets.UTF_8);
                    if (url.startsWith("http://") || url.startsWith("https://")) {
                        return url;
                    }
                }
            } catch (Exception e) {
                log.warn("Could not decode frontend URL from OAuth state: {}", e.getMessage());
            }
        }
        return getDynamicFrontendUrl(request);
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