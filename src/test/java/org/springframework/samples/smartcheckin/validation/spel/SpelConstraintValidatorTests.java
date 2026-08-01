package org.springframework.samples.smartcheckin.validation.spel;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.validation.ConstraintValidatorContext;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SpelConstraintValidatorTests {

	private SpelConstraintValidator validator;

	@BeforeEach
	void setUp() {
		validator = new SpelConstraintValidator();
		ValidateElementIn annotation = mock(ValidateElementIn.class);
		when(annotation.element()).thenReturn("child");
		when(annotation.collection()).thenReturn("parentList");
		validator.initialize(annotation);
	}

	static class DummyClass {
		private String child;
		private List<String> parentList;

		public DummyClass(String child, List<String> parentList) {
			this.child = child;
			this.parentList = parentList;
		}

		public String getChild() { return child; }
		public List<String> getParentList() { return parentList; }
	}

	@Test
	void testIsValidNullValues() {
		ConstraintValidatorContext context = mock(ConstraintValidatorContext.class);
		assertTrue(validator.isValid(null, context));
	}

	@Test
	void testIsValidElementInCollection() {
		ConstraintValidatorContext context = mock(ConstraintValidatorContext.class);
		DummyClass target = new DummyClass("apple", List.of("apple", "banana"));
		assertTrue(validator.isValid(target, context));
	}

	@Test
	void testIsValidElementNotInCollection() {
		ConstraintValidatorContext context = mock(ConstraintValidatorContext.class);
		DummyClass target = new DummyClass("cherry", List.of("apple", "banana"));
		assertFalse(validator.isValid(target, context));
	}

	@Test
	void testIsValidNotACollection() {
		ConstraintValidatorContext context = mock(ConstraintValidatorContext.class);
		ValidateElementIn badAnnotation = mock(ValidateElementIn.class);
		when(badAnnotation.element()).thenReturn("child");
		when(badAnnotation.collection()).thenReturn("child");
		validator.initialize(badAnnotation);

		DummyClass target = new DummyClass("apple", List.of("apple", "banana"));
		assertFalse(validator.isValid(target, context));
	}

	@Test
	void testIsValidExceptionHandling() {
		ConstraintValidatorContext context = mock(ConstraintValidatorContext.class);
		ValidateElementIn badAnnotation = mock(ValidateElementIn.class);
		when(badAnnotation.element()).thenReturn("invalid#@expr");
		when(badAnnotation.collection()).thenReturn("parentList");
		validator.initialize(badAnnotation);

		DummyClass target = new DummyClass("apple", List.of("apple", "banana"));
		assertFalse(validator.isValid(target, context));
	}
}
