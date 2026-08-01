package org.springframework.samples.smartcheckin.configuration.jwt;

import static org.mockito.Mockito.*;

import java.io.ByteArrayOutputStream;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.AuthenticationException;

class AuthEntryPointJwtTests {

	@Test
	void testCommence() throws Exception {
		AuthEntryPointJwt entryPoint = new AuthEntryPointJwt();

		HttpServletRequest request = mock(HttpServletRequest.class);
		HttpServletResponse response = mock(HttpServletResponse.class);
		AuthenticationException authException = mock(AuthenticationException.class);

		when(request.getServletPath()).thenReturn("/api/v1/test");
		when(authException.getMessage()).thenReturn("Full authentication is required");

		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		ServletOutputStream sos = new ServletOutputStream() {
			@Override
			public boolean isReady() {
				return true;
			}

			@Override
			public void setWriteListener(WriteListener writeListener) {
				// Not required for mock output stream testing
			}

			@Override
			public void write(int b) {
				baos.write(b);
			}
		};

		when(response.getOutputStream()).thenReturn(sos);

		entryPoint.commence(request, response, authException);

		verify(response).setContentType("application/json");
		verify(response).setStatus(401);
	}
}
