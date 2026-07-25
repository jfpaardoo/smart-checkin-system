package org.springframework.samples.petclinic.checkin;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.petclinic.user.User;
import org.springframework.samples.petclinic.user.UserService;
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

    @Autowired
    public CheckinRestController(CheckinService checkInService, UserService userService) {
        this.checkInService = checkInService;
        this.userService = userService;
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
        Checkin checkIn = new Checkin();
        checkIn.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
        checkIn.setCheckInType(request.getCheckInType());
        checkIn.setUser(currentUser);
        
        currentUser.setIsWorking(request.getCheckInType() == CheckinType.ENTRADA);
        userService.saveUser(currentUser);
        
        Checkin saved = checkInService.save(checkIn);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
}
