package org.springframework.samples.smartcheckin.settings;

import org.springframework.samples.smartcheckin.model.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "cloud_settings")
public class CloudSettings extends BaseEntity {

    @Column(name = "provider")
    private String provider; // "ONEDRIVE" or "GOOGLE_DRIVE"

    @Column(name = "onedrive_client_id")
    private String oneDriveClientId;

    @Column(name = "onedrive_client_secret")
    private String oneDriveClientSecret;

    @Column(name = "onedrive_tenant_id")
    private String oneDriveTenantId;

    @Column(name = "onedrive_refresh_token", columnDefinition = "TEXT")
    private String oneDriveRefreshToken;

}
