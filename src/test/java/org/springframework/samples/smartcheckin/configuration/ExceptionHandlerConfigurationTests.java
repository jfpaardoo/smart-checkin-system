package org.springframework.samples.smartcheckin.configuration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.Test;

class ExceptionHandlerConfigurationTests {

	@Test
	void testDefaultErrorHandler() {
		ExceptionHandlerConfiguration config = new ExceptionHandlerConfiguration();
		HttpServletRequest request = mock(HttpServletRequest.class);
		Exception ex = new RuntimeException("Test error");

		when(request.getPathInfo()).thenReturn("/test-path");

		String view = config.defaultErrorHandler(request, ex);

		assertEquals("exception", view);
		verify(request).setAttribute("jakarta.servlet.error.request_uri", "/test-path");
		verify(request).setAttribute("jakarta.servlet.error.status_code", 400);
		verify(request).setAttribute("exeption", ex);
	}
}
