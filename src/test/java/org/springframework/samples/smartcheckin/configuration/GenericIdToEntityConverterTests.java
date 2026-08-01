package org.springframework.samples.smartcheckin.configuration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.samples.smartcheckin.user.User;

class GenericIdToEntityConverterTests {

	private EntityManager entityManager;
	private GenericIdToEntityConverter converter;

	@BeforeEach
	void setUp() {
		entityManager = mock(EntityManager.class);
		converter = new GenericIdToEntityConverter(entityManager);
	}

	@Test
	void testGetConvertibleTypes() {
		var types = converter.getConvertibleTypes();
		assertNotNull(types);
		assertEquals(2, types.size());
	}

	@Test
	void testMatches() {
		TypeDescriptor sourceType = TypeDescriptor.valueOf(String.class);
		TypeDescriptor targetType = TypeDescriptor.valueOf(User.class);

		assertTrue(converter.matches(sourceType, targetType));

		TypeDescriptor invalidTarget = TypeDescriptor.valueOf(String.class);
		assertFalse(converter.matches(sourceType, invalidTarget));
	}

	@Test
	void testConvertSuccess() {
		TypeDescriptor sourceType = TypeDescriptor.valueOf(String.class);
		TypeDescriptor targetType = TypeDescriptor.valueOf(User.class);

		User user = new User();
		user.setId(1);

		when(entityManager.find(User.class, 1)).thenReturn(user);

		Object result = converter.convert("1", sourceType, targetType);
		assertNotNull(result);
		assertEquals(user, result);
	}

	@Test
	void testConvertNotFound() {
		TypeDescriptor sourceType = TypeDescriptor.valueOf(Integer.class);
		TypeDescriptor targetType = TypeDescriptor.valueOf(User.class);

		when(entityManager.find(User.class, 99)).thenReturn(null);

		Object result = converter.convert(99, sourceType, targetType);
		assertNull(result);
	}

	@Test
	void testConvertNullSourceOrEntityManager() {
		TypeDescriptor sourceType = TypeDescriptor.valueOf(Integer.class);
		TypeDescriptor targetType = TypeDescriptor.valueOf(User.class);

		assertNull(converter.convert(null, sourceType, targetType));

		GenericIdToEntityConverter nullEmConverter = new GenericIdToEntityConverter(null);
		assertNull(nullEmConverter.convert(1, sourceType, targetType));
	}
}
