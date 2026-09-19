package org.springframework.samples.smartcheckin.auth.payload.response;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JwtResponse {

    private String token;
    private String type = "Bearer";
    private Integer id;
    private String username;
    private List<String> roles;
    private Boolean requiresTwoFactor = false;
    private Boolean hasPasskeys = false;
    private Boolean requiresPasskey = false;

    public JwtResponse() {
    }

    public JwtResponse(String accessToken, Integer id, String username, List<String> roles) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.roles = roles;
    }

    public JwtResponse(String jwt, Long id, String username, List<String> roles) {
        this.token = jwt;
        this.id = id != null ? id.intValue() : null;
        this.username = username;
        this.roles = roles;
    }

    public JwtResponse(String accessToken, Integer id, String username, List<String> roles, Boolean hasPasskeys) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.roles = roles;
        this.hasPasskeys = hasPasskeys != null && hasPasskeys;
    }

    @Override
    public String toString() {
        return "JwtResponse [token=" + token + ", type=" + type + ", id=" + id + ", username=" + username
                + ", roles=" + roles + ", requiresTwoFactor=" + requiresTwoFactor + ", hasPasskeys=" + hasPasskeys + "]";
    }
}