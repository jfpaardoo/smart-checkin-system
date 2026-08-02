package org.springframework.samples.smartcheckin.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;

class RestPreconditionsTests {

	@Test
	void testConstructorThrowsAssertionError() throws NoSuchMethodException {
		Constructor<RestPreconditions> constructor = RestPreconditions.class.getDeclaredConstructor();
		assertTrue(java.lang.reflect.Modifier.isPrivate(constructor.getModifiers()));
		constructor.setAccessible(true);
		
		InvocationTargetException exception = assertThrows(InvocationTargetException.class, constructor::newInstance);
		assertTrue(exception.getCause() instanceof AssertionError);
	}

	@Test
	void testCheckNotNullWithNonNull() {
		String result = RestPreconditions.checkNotNull("test", "Resource", "Field", "Value");
		assertEquals("test", result);
	}

	@Test
	void testCheckNotNullWithNull() {
		ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> 
			RestPreconditions.checkNotNull(null, "Resource", "Field", "Value")
		);
		assertEquals("Resource not found with Field: 'Value'", ex.getMessage());
	}
}
