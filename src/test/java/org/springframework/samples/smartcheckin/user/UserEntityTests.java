package org.springframework.samples.smartcheckin.user;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

class UserEntityTests {

	@Test
	void testHasAuthority() {
		User user = new User();
		Authorities auth = new Authorities();
		auth.setAuthority("ADMIN");
		user.setAuthority(auth);

		assertTrue(user.hasAuthority("ADMIN"));
		assertFalse(user.hasAuthority("USER"));
	}

	@Test
	void testHasAnyAuthority() {
		User user = new User();
		Authorities auth = new Authorities();
		auth.setAuthority("ADMIN");
		user.setAuthority(auth);

		assertTrue(user.hasAnyAuthority("USER", "ADMIN"));
		assertFalse(user.hasAnyAuthority("USER", "MANAGER"));
	}

	@Test
	void testGetAuthorities() {
		User user = new User();
		assertTrue(user.getAuthorities().isEmpty());

		Authorities auth = new Authorities();
		auth.setAuthority("ADMIN");
		user.setAuthority(auth);

		List<GrantedAuthority> authorities = user.getAuthorities();
		assertEquals(1, authorities.size());
		assertEquals("ADMIN", authorities.getFirst().getAuthority());
	}
}
