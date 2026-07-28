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
            this.oneDriveClientSecret = settings.getOneDriveClientSecret();
            this.oneDriveTenantId = settings.getOneDriveTenantId();
            this.oneDriveRefreshToken = settings.getOneDriveRefreshToken();
        }
    }

    public CloudSettings toEntity(CloudSettings existing) {
        CloudSettings entity = existing != null ? existing : new CloudSettings();
        entity.setProvider(this.provider);
        entity.setOneDriveClientId(this.oneDriveClientId);
        entity.setOneDriveClientSecret(this.oneDriveClientSecret);
        entity.setOneDriveTenantId(this.oneDriveTenantId);
        entity.setOneDriveRefreshToken(this.oneDriveRefreshToken);
        return entity;
    }
}
