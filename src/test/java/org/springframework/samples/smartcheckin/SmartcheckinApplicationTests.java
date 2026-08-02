package org.springframework.samples.smartcheckin;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mockStatic;

class SmartcheckinApplicationTests {

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
            assertEquals("postgres", System.getProperty("spring.profiles.default"));
        }
    }
}
