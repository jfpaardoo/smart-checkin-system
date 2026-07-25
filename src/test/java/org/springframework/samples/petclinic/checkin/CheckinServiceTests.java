package org.springframework.samples.petclinic.checkin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.samples.petclinic.user.User;
import org.springframework.samples.petclinic.user.UserService;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureTestDatabase
class CheckinServiceTests {

    @Autowired
    private CheckinService checkInService;

    @Autowired
    private UserService userService;

    @Test
    @Transactional
    void shouldSaveAndFindCheckIns() {
        // Retrieve or create a test user
        User user = userService.findUser(1); // Assuming user with ID 1 exists from data.sql
        assertNotNull(user);

        // Create Checkin
        Checkin checkin = new Checkin();
        checkin.setCheckInDate(LocalDateTime.now());
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setUser(user);

        // Save
        Checkin saved = checkInService.save(checkin);
        assertNotNull(saved.getId());

        // Find
        List<Checkin> checkins = checkInService.findByUserId(user.getId());
        assertEquals(1, checkins.size());
        assertEquals(CheckinType.ENTRADA, checkins.get(0).getCheckInType());
    }
}
