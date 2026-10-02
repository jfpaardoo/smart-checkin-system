package org.springframework.samples.smartcheckin.user;

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
public class UserResponseDTO {

    private Integer id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String personalCode;
    private String locator;
    private Boolean isWorking;
    private Boolean isApproved;
    private Boolean twoFactorEnabled;
    private String twoFactorType;
    private String companyName;
    private String authority;

    public static UserResponseDTO fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .personalCode(user.getPersonalCode())
                .locator(user.getLocator())
                .isWorking(user.getIsWorking())
                .isApproved(user.getIsApproved())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .twoFactorType(user.getTwoFactorType())
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .authority(user.getAuthority() != null ? user.getAuthority().getAuthority() : null)
                .build();
    }
}
