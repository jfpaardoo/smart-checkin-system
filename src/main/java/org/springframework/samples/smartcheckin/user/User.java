package org.springframework.samples.smartcheckin.user;

import java.util.List;
import java.util.Set;
import java.util.HashSet;

import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.company.Company;
import org.springframework.samples.smartcheckin.configuration.StringCryptoConverter;

import java.time.LocalDateTime;

import org.springframework.samples.smartcheckin.model.BaseEntity;
import org.springframework.samples.smartcheckin.push.PushSubscriptionEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.OneToMany;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.FetchType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Convert;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@org.jpatterns.gof.BuilderPattern.Builder
@lombok.Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
@EqualsAndHashCode(callSuper = false, exclude = {"formationAttendances", "checkins", "pushSubscriptions"})
@Entity
@Table(name = "appusers")
public class User extends BaseEntity implements OrganizationalUnit {

    @NotBlank
    @Size(min = 1, max = 255)
    @Column(unique = true)
    private String username;

    @NotBlank
    @Email
    @Size(min = 1, max = 255)
    @Column(unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @NotBlank
    @Size(min = 4, max = 4)
    @Column(unique = true, length = 4)
    private String personalCode;

    @Column(name = "locator", length = 10)
    private String locator;

    @NotBlank
    @Size(max = 255)
    private String firstName;

    @NotBlank
    @Size(max = 255)
    private String lastName;

    @NotNull
    @Column(name = "is_working")
    @lombok.Builder.Default
    private Boolean isWorking = false;

    @NotNull
    @Column(name = "is_approved")
    @lombok.Builder.Default
    private Boolean isApproved = true;

    @Column(name = "failed_login_attempts")
    @lombok.Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    @Column(name = "two_factor_enabled")
    @lombok.Builder.Default
    private Boolean twoFactorEnabled = false;

    @Column(name = "two_factor_type", length = 10)
    @lombok.Builder.Default
    private String twoFactorType = "APP"; // Can be 'APP', 'EMAIL'

    @Column(name = "two_factor_secret")
    @Convert(converter = StringCryptoConverter.class)
    private String twoFactorSecret;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_2fa_backup_codes", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "code_hash")
    @lombok.Builder.Default
    @JsonIgnore
    private Set<String> twoFactorBackupCodes = new HashSet<>();

    @NotNull
    @Column(name = "email_notifications_enabled")
    @lombok.Builder.Default
    private Boolean emailNotificationsEnabled = true;

    @NotNull
    @Column(name = "push_notifications_enabled")
    @lombok.Builder.Default
    private Boolean pushNotificationsEnabled = true;

    @Column(name = "privacy_policy_accepted")
    @lombok.Builder.Default
    private Boolean privacyPolicyAccepted = false;

    @Column(name = "privacy_policy_accepted_at")
    private LocalDateTime privacyPolicyAcceptedAt;

    @Transient
    public String getEmployeeBlock() {
        String fName = this.firstName != null ? this.firstName.replace(" ", "_") : "";
        String lName = this.lastName != null ? this.lastName.replace(" ", "_") : "";
        return String.format("%s_%s_%s", this.personalCode, fName, lName);
    }

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "authority")
    Authorities authority;

    public Boolean hasAuthority(String auth) {
        return authority.getAuthority().equals(auth);
    }

    public Boolean hasAnyAuthority(String... authorities) {
        Boolean cond = false;
        for (String auth : authorities) {
            if (auth.equals(authority.getAuthority()))
                cond = true;
        }
        return cond;
    }

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<FormationAttendance> formationAttendances;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Checkin> checkins;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<PushSubscriptionEntity> pushSubscriptions;

    @JsonIgnore
    public List<GrantedAuthority> getAuthorities() {
        if (authority != null && authority.getAuthority() != null) {
            return List.of(new SimpleGrantedAuthority(authority.getAuthority()));
        }
        return List.of();
    }

    @ManyToOne
    @JoinColumn(name = "department_id")
    @JsonIgnore
    private Department department;

    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;

    @Override
    @Transient
    public String getName() {
        return this.firstName + " " + this.lastName;
    }

    @Override
    @Transient
    public int getTotalEmployees() {
        return 1;
    }

    @Override
    @Transient
    public int getCurrentlyWorkingCount() {
        return (this.isWorking != null && this.isWorking) ? 1 : 0;
    }
}