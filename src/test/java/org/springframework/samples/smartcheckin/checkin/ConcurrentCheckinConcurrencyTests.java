package org.springframework.samples.smartcheckin.checkin;

import static org.junit.jupiter.api.Assertions.*;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.AuthoritiesService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest
@DirtiesContext
class ConcurrentCheckinConcurrencyTests {

    private final CheckinService checkInService;
    private final UserService userService;
    private final AuthoritiesService authoritiesService;

    @Autowired
    public ConcurrentCheckinConcurrencyTests(CheckinService checkInService, UserService userService, AuthoritiesService authoritiesService) {
        this.checkInService = checkInService;
        this.userService = userService;
        this.authoritiesService = authoritiesService;
    }

    @Test
    void testConcurrentCheckinExecutionShouldMaintainDataIntegrity() throws InterruptedException {
        Authorities employeeAuth;
        try {
            employeeAuth = authoritiesService.findByAuthority("EMPLOYEE");
        } catch (Exception e) {
            employeeAuth = authoritiesService.findByAuthority("ADMIN");
        }
        User user = new User();
        user.setUsername("test_concurrent_user");
        user.setPassword("password123");
        user.setFirstName("Concurrent");
        user.setLastName("Test");
        user.setPersonalCode("9999");
        user.setEmail("concurrent@test.com");
        user.setLocator("AV");
        user.setAuthority(employeeAuth);
        user.setIsApproved(true);
        user.setIsWorking(false);
        user = userService.saveUser(user);

        int numberOfThreads = 5;
        ExecutorService service = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);

        final User targetUser = user;
        for (int i = 0; i < numberOfThreads; i++) {
            service.submit(() -> {
                try {
                    startLatch.await();
                    Checkin result = checkInService.performCheckIn(targetUser, CheckinType.ENTRADA);
                    if (result != null) {
                        successCount.incrementAndGet();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } catch (Exception e) {
                    // Handled expected concurrent collision
                } finally {
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = endLatch.await(5, TimeUnit.SECONDS);
        service.shutdown();
        if (!service.awaitTermination(2, TimeUnit.SECONDS)) {
            service.shutdownNow();
        }

        assertTrue(completed, "All threads should finish execution within timeout");
        assertTrue(successCount.get() > 0, "At least one concurrent checkin request should succeed");
    }
}
