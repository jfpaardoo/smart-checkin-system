package org.springframework.samples.smartcheckin.configuration.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class UserDetailsServiceImplTests {

	private UserRepository userRepository;
	private UserDetailsServiceImpl userDetailsService;

	private static final String USER1_USERNAME = "user1";

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		userDetailsService = new UserDetailsServiceImpl(userRepository);
	}

	@Test
	void testLoadUserByUsernameFound() {
		User user = new User();
		user.setId(1);
		user.setUsername(USER1_USERNAME);
		user.setPassword("pass");
		Authorities auth = new Authorities();
		auth.setAuthority("ADMIN");
		user.setAuthority(auth);

		when(userRepository.findByUsername(USER1_USERNAME)).thenReturn(Optional.of(user));

		UserDetails details = userDetailsService.loadUserByUsername(USER1_USERNAME);
		assertNotNull(details);
		assertEquals(USER1_USERNAME, details.getUsername());
		assertEquals("pass", details.getPassword());
		assertTrue(details.isAccountNonExpired());
		assertTrue(details.isAccountNonLocked());
		assertTrue(details.isCredentialsNonExpired());
		assertTrue(details.isEnabled());
	}

	@Test
	void testLoadUserByUsernameNotFound() {
		when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

		assertThrows(UsernameNotFoundException.class, () -> userDetailsService.loadUserByUsername("unknown"));
	}

	@Test
	void testUserDetailsImplEqualsAndHashCode() {
		UserDetailsImpl u1 = new UserDetailsImpl(1, "u1", "p1", null);
		UserDetailsImpl u2 = new UserDetailsImpl(1, "u1", "p1", null);
		UserDetailsImpl u3 = new UserDetailsImpl(2, "u2", "p2", null);

		assertEquals(u1, u2);
		assertNotEquals(u1, u3);
		assertNotEquals(null, u1);
		assertNotEquals("otherType", u1);
		assertEquals(u1.hashCode(), u2.hashCode());
		assertEquals(1, u1.getId());
	}
}
