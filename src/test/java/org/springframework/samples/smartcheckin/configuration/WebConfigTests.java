package org.springframework.samples.smartcheckin.configuration;

import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.springframework.format.FormatterRegistry;

@SuppressWarnings("null")
class WebConfigTests {

	@Test
	void testAddFormatters() {
		GenericIdToEntityConverter converter = mock(GenericIdToEntityConverter.class);
		WebConfig webConfig = new WebConfig(converter);

		FormatterRegistry registry = mock(FormatterRegistry.class);
		webConfig.addFormatters(registry);

		verify(registry).addConverter(converter);
	}
}
