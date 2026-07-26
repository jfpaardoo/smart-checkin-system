package org.springframework.samples.petclinic.checkin;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.petclinic.user.User;
import org.springframework.samples.petclinic.user.UserService;
import org.springframework.samples.petclinic.totp.TotpService;
import org.springframework.samples.petclinic.exceptions.ResourceNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1/checkins")
@SecurityRequirement(name = "bearerAuth")
public class CheckinRestController {

    private final CheckinService checkInService;
    private final UserService userService;
    private final TotpService totpService;

    @Autowired
    public CheckinRestController(CheckinService checkInService, UserService userService, TotpService totpService) {
        this.checkInService = checkInService;
        this.userService = userService;
        this.totpService = totpService;
    }

    @GetMapping("/my-history")
    public ResponseEntity<List<Checkin>> getMyHistory() {
        User currentUser = userService.findCurrentUser();
        List<Checkin> checkIns = checkInService.findByUserId(currentUser.getId());
        return new ResponseEntity<>(checkIns, HttpStatus.OK);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Checkin> checkIn(@RequestBody @Valid CheckinRequest request) {
        User currentUser = userService.findCurrentUser();
        Checkin saved = checkInService.performCheckIn(currentUser, request.getCheckInType());
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping("/qr-fichaje")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Object> qrCheckin(@RequestBody @Valid QrCheckinRequest request) {
        
        if (!totpService.verifyToken(request.getToken())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired TOTP token");
        }

        User user;
        try {
            user = userService.findUser(request.getPersonalCode());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        CheckinType type = user.getIsWorking() != null && user.getIsWorking() ? CheckinType.SALIDA : CheckinType.ENTRADA;
        Checkin saved = checkInService.performCheckIn(user, type);

        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
}
