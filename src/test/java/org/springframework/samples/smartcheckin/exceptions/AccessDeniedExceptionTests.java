package org.springframework.samples.smartcheckin.exceptions;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class AccessDeniedExceptionTests {

	@Test
	void testNoArgsConstructor() {
		AccessDeniedException ex = new AccessDeniedException();
		assertEquals("Access denied!", ex.getMessage());
	}

	@Test
	void testMessageConstructor() {
		AccessDeniedException ex = new AccessDeniedException("Custom access denied message");
		assertEquals("Custom access denied message", ex.getMessage());
	}
}
