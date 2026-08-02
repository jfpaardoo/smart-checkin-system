package org.springframework.samples.smartcheckin.configuration.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import java.util.Collections;

import org.junit.jupiter.api.Test;

class UserDetailsImplTests {

	@Test
	void testEquals() {
		UserDetailsImpl user1 = new UserDetailsImpl(1, "user1", "pass", Collections.emptyList());
		UserDetailsImpl user2 = new UserDetailsImpl(1, "user2", "pass2", Collections.emptyList());
		UserDetailsImpl user3 = new UserDetailsImpl(2, "user3", "pass", Collections.emptyList());

		// Test same object
		assertEquals(user1, user1);

		// Test null
		assertNotEquals(null, user1);

		// Test different class
		assertNotEquals(new Object(), user1);

		// Test same id
		assertEquals(user1, user2);

		// Test different id
		assertNotEquals(user3, user1);
        
        // Test hashCode consistency
        assertEquals(user1.hashCode(), user2.hashCode());
        assertNotEquals(user3.hashCode(), user1.hashCode());
	}
}
