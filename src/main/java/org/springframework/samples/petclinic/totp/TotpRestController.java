package org.springframework.samples.petclinic.totp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/totp")
@Tag(name = "TOTP", description = "The TOTP dynamic QR token API")
@SecurityRequirement(name = "bearerAuth")
public class TotpRestController {

    private final TotpService totpService;

    @Autowired
    public TotpRestController(TotpService totpService) {
        this.totpService = totpService;
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, String>> getCurrentToken() {
        String token = totpService.getCurrentToken();
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        return ResponseEntity.ok(response);
    }
}
