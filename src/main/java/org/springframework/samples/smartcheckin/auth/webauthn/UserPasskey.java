package org.springframework.samples.smartcheckin.auth.webauthn;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.samples.smartcheckin.model.BaseEntity;
import org.springframework.samples.smartcheckin.user.User;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Table(name = "user_passkeys")
public class UserPasskey extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "credential_id", nullable = false, unique = true, length = 512)
    private String credentialId;

    @Column(name = "public_key", nullable = false, length = 2048)
    private String publicKey;

    @Column(name = "sign_count", nullable = false)
    private Long signCount;

    @Column(name = "device_type", length = 100)
    private String deviceType;

    @Column(name = "nickname", length = 100)
    private String nickname;

    @Column(name = "aaguid", length = 64)
    private String aaguid;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
}
