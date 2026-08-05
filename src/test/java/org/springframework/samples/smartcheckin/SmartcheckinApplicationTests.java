package org.springframework.samples.smartcheckin;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mockStatic;

class SmartcheckinApplicationTests {

    private static final String SPRING_PROFILES_DEFAULT = "spring.profiles.default";
    private static final String PROFILE = "postgres";

    @AfterEach
    void tearDown() {
        System.clearProperty(SPRING_PROFILES_DEFAULT);
    }

    @Test
    void contextLoads() {
        SmartcheckinApplication app = new SmartcheckinApplication();
        assertNotNull(app);
    }

    @Test
    void testMain() {
        try (MockedStatic<SpringApplication> mocked = mockStatic(SpringApplication.class)) {
            SmartcheckinApplication.main(new String[]{});
            mocked.verify(() -> SpringApplication.run(SmartcheckinApplication.class, new String[]{}));
            assertEquals(PROFILE, System.getProperty(SPRING_PROFILES_DEFAULT));
        } finally {
            System.clearProperty(SPRING_PROFILES_DEFAULT);
        }
    }
}