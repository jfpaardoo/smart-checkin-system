package org.springframework.samples.smartcheckin;

import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

class SmartcheckinInitializerTests {

    @Test
    void testConfigure() {
        SmartcheckinInitializer initializer = new SmartcheckinInitializer();
        SpringApplicationBuilder builder = mock(SpringApplicationBuilder.class);
        when(builder.sources(SmartcheckinApplication.class)).thenReturn(builder);

        SpringApplicationBuilder result = initializer.configure(builder);

        assertNotNull(result);
        verify(builder).sources(SmartcheckinApplication.class);
    }
}
