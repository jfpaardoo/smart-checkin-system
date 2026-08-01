package org.springframework.samples.smartcheckin.util;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CallMonitoringAspectTests {

	private CallMonitoringAspect aspect;

	@BeforeEach
	void setUp() {
		aspect = new CallMonitoringAspect();
	}

	@Test
	void testEnabledDisabledReset() {
		assertTrue(aspect.isEnabled());
		aspect.setEnabled(false);
		assertFalse(aspect.isEnabled());

		aspect.reset();
		assertEquals(0, aspect.getCallCount());
		assertEquals(0, aspect.getCallTime());
	}

	@Test
	void testInvokeWhenEnabled() throws Throwable {
		ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
		when(joinPoint.toShortString()).thenReturn("MockedRepository.find");
		when(joinPoint.proceed()).thenReturn("result");

		Object result = aspect.invoke(joinPoint);

		assertEquals("result", result);
		assertEquals(1, aspect.getCallCount());
		assertTrue(aspect.getCallTime() >= 0);
	}

	@Test
	void testInvokeWhenDisabled() throws Throwable {
		aspect.setEnabled(false);
		ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
		when(joinPoint.proceed()).thenReturn("result");

		Object result = aspect.invoke(joinPoint);

		assertEquals("result", result);
		assertEquals(0, aspect.getCallCount());
	}
}
