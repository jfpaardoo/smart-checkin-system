package org.springframework.samples.smartcheckin.settings;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CloudSettingsDTO {
    private String provider;
    private String oneDriveClientId;
    private String oneDriveClientSecret;
    private String oneDriveTenantId;
    private String oneDriveRefreshToken;

    public CloudSettingsDTO() {}

    public CloudSettingsDTO(CloudSettings settings) {
        if (settings != null) {
            this.provider = settings.getProvider();
            this.oneDriveClientId = settings.getOneDriveClientId();
            this.oneDriveClientSecret = settings.getOneDriveClientSecret() != null ? "********" : null;
            this.oneDriveTenantId = settings.getOneDriveTenantId();
            this.oneDriveRefreshToken = settings.getOneDriveRefreshToken() != null ? "CONNECTED" : null;
        }
    }

    public CloudSettings toEntity(CloudSettings existing) {
        CloudSettings entity = existing != null ? existing : new CloudSettings();
        entity.setProvider(this.provider);
        entity.setOneDriveClientId(this.oneDriveClientId);
        if (this.oneDriveClientSecret != null && !"********".equals(this.oneDriveClientSecret)) {
            entity.setOneDriveClientSecret(this.oneDriveClientSecret);
        } else if (existing != null) {
            entity.setOneDriveClientSecret(existing.getOneDriveClientSecret());
        }
        entity.setOneDriveTenantId(this.oneDriveTenantId);
        if (this.oneDriveRefreshToken != null && !"CONNECTED".equals(this.oneDriveRefreshToken)) {
            entity.setOneDriveRefreshToken(this.oneDriveRefreshToken);
        } else if (existing != null) {
            entity.setOneDriveRefreshToken(existing.getOneDriveRefreshToken());
        }
        return entity;
    }
}
