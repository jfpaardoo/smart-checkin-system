package org.springframework.samples.smartcheckin.exceptions;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.WebRequest;

@SuppressWarnings("null")
class ExceptionHandlerControllerTests {

	private ExceptionHandlerController controller;
	private WebRequest webRequest;

	@BeforeEach
	void setUp() {
		controller = new ExceptionHandlerController();
		webRequest = mock(WebRequest.class);
		when(webRequest.getDescription(false)).thenReturn("uri=/test");
	}

	@Test
	void testGlobalExceptionHandler() {
		Exception ex = new Exception("Global error");
		ResponseEntity<ErrorMessage> response = controller.globalExceptionHandler(ex, webRequest);

		assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
		assertNotNull(response.getBody());
		assertEquals("Global error", response.getBody().getMessage());
	}

	@Test
	void testResourceNotFoundException() {
		ResourceNotFoundException ex = new ResourceNotFoundException("Not found");
		ResponseEntity<ErrorMessage> response = controller.resourceNotFoundException(ex, webRequest);

		assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
		assertNotNull(response.getBody());
		assertEquals("Not found", response.getBody().getMessage());
	}

	@Test
	void testResourceNotOwnedException() {
		ResourceNotOwnedException ex = new ResourceNotOwnedException("Resource");
		ResponseEntity<ErrorMessage> response = controller.resourceNotOwnedException(ex, webRequest);

		assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
		assertNotNull(response.getBody());
	}

	@Test
	void testAccessDeniedException() {
		AccessDeniedException ex = new AccessDeniedException("Access denied");
		ResponseEntity<ErrorMessage> response = controller.handleAccessDeniedException(ex, webRequest);

		assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
		assertNotNull(response.getBody());
		assertEquals("Access denied", response.getBody().getMessage());
	}
}
