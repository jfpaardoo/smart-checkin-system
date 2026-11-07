package org.springframework.samples.smartcheckin.user;

import org.springframework.samples.smartcheckin.company.Company;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {

    @NotBlank
    @Size(min = 1, max = 255)
    private String username;

    @NotBlank
    @Email
    @Size(min = 1, max = 255)
    private String email;

    private String password;

    @NotBlank
    @Size(max = 255)
    private String firstName;

    @NotBlank
    @Size(max = 255)
    private String lastName;

    @NotBlank
    @Size(min = 4, max = 4)
    private String personalCode;

    private String locator;

    @Builder.Default
    private Boolean isWorking = false;

    @Builder.Default
    private Boolean isApproved = true;

    private Authorities authority;

    private Company company;

    @Builder.Default
    private String twoFactorType = "APP";

    @Builder.Default
    private Boolean twoFactorEnabled = false;

    @Builder.Default
    private Boolean emailNotificationsEnabled = true;

    @Builder.Default
    private Boolean pushNotificationsEnabled = true;

    public User toEntity() {
        User user = new User();
        user.setUsername(this.username);
        user.setEmail(this.email);
        user.setPassword(this.password);
        user.setFirstName(this.firstName);
        user.setLastName(this.lastName);
        user.setPersonalCode(this.personalCode);
        user.setLocator(this.locator);
        user.setIsWorking(this.isWorking != null ? this.isWorking : false);
        user.setIsApproved(this.isApproved != null ? this.isApproved : true);
        user.setAuthority(this.authority);
        user.setCompany(this.company);
        user.setTwoFactorType(this.twoFactorType != null ? this.twoFactorType : "APP");
        user.setTwoFactorEnabled(this.twoFactorEnabled != null ? this.twoFactorEnabled : false);
        user.setEmailNotificationsEnabled(this.emailNotificationsEnabled != null ? this.emailNotificationsEnabled : true);
        user.setPushNotificationsEnabled(this.pushNotificationsEnabled != null ? this.pushNotificationsEnabled : true);
        return user;
    }
}

