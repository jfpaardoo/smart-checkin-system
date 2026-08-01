package org.springframework.samples.smartcheckin.audit;

import static org.mockito.Mockito.*;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@SuppressWarnings({"null", "unused"})
class AuditAspectTests {

	private AuditLogRepository auditLogRepository;
	private AuditAspect aspect;

	@BeforeEach
	void setUp() {
		auditLogRepository = mock(AuditLogRepository.class);
		HttpServletRequest request = mock(HttpServletRequest.class);
		when(request.getRemoteAddr()).thenReturn("127.0.0.1");
		aspect = new AuditAspect(auditLogRepository, request);

		SecurityContext securityContext = mock(SecurityContext.class);
		Authentication authentication = mock(Authentication.class);
		when(authentication.getName()).thenReturn("testuser");
		when(securityContext.getAuthentication()).thenReturn(authentication);
		SecurityContextHolder.setContext(securityContext);
	}

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void testLogUserSave() {
		JoinPoint joinPoint = mock(JoinPoint.class);
		
		class DummyUser {
			public String getUsername() { return "john_doe"; }
		}
		
		aspect.logUserSave(joinPoint, new DummyUser());
		verify(auditLogRepository, times(1)).save(any(AuditLog.class));
	}

	@Test
	void testLogFormationSave() {
		JoinPoint joinPoint = mock(JoinPoint.class);
		class DummyFormation {
			public String getName() { return "Math Course"; }
		}

		aspect.logFormationSave(joinPoint, new DummyFormation());
		verify(auditLogRepository, times(1)).save(any(AuditLog.class));
	}

	@Test
	void testLogFormationDelete() {
		JoinPoint joinPoint = mock(JoinPoint.class);
		when(joinPoint.getArgs()).thenReturn(new Object[]{"123"});

		aspect.logFormationDelete(joinPoint);
		verify(auditLogRepository, times(1)).save(any(AuditLog.class));
	}

	@Test
	void testLogCheckIn() {
		JoinPoint joinPoint = mock(JoinPoint.class);
		aspect.logCheckIn(joinPoint, new Object());
		verify(auditLogRepository, times(1)).save(any(AuditLog.class));
	}

	@Test
	void testLogCheckOut() {
		JoinPoint joinPoint = mock(JoinPoint.class);
		aspect.logCheckOut(joinPoint, new Object());
		verify(auditLogRepository, times(1)).save(any(AuditLog.class));
	}
}
