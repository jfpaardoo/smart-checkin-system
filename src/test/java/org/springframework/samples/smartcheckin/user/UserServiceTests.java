package org.springframework.samples.smartcheckin.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

class UserServiceTests {

	private UserRepository userRepository;
	private UserService userService;

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		userService = new UserService(userRepository);
	}

	@Test
	void testSaveUser() {
		User user = new User();
		user.setUsername("john");

		when(userRepository.save(user)).thenReturn(user);

		User saved = userService.saveUser(user);
		assertNotNull(saved);
		assertEquals("john", saved.getUsername());
		verify(userRepository, times(1)).save(user);
	}

	@Test
	void testFindUserByUsernameFound() {
		User user = new User();
		user.setUsername("john");
		when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));

		User found = userService.findUser("john");
		assertEquals("john", found.getUsername());
	}

	@Test
	void testFindUserByUsernameNotFound() {
		when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
		assertThrows(ResourceNotFoundException.class, () -> userService.findUser("john"));
	}

	@Test
	void testFindUserByIdFound() {
		User user = new User();
		user.setId(1);
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		User found = userService.findUser(1);
		assertEquals(1, found.getId());
	}

	@Test
	void testFindUserByIdNotFound() {
		when(userRepository.findById(1)).thenReturn(Optional.empty());
		assertThrows(ResourceNotFoundException.class, () -> userService.findUser(1));
	}

	@Test
	void testFindByPersonalCodeFound() {
		User user = new User();
		user.setPersonalCode("1234");
		when(userRepository.findByPersonalCode("1234")).thenReturn(Optional.of(user));

		User found = userService.findByPersonalCode("1234");
		assertEquals("1234", found.getPersonalCode());
	}

	@Test
	void testFindByPersonalCodeNotFound() {
		when(userRepository.findByPersonalCode("1234")).thenReturn(Optional.empty());
		assertThrows(ResourceNotFoundException.class, () -> userService.findByPersonalCode("1234"));
	}

	@Test
	void testFindCurrentUserNoAuth() {
		SecurityContextHolder.clearContext();
		assertThrows(ResourceNotFoundException.class, () -> userService.findCurrentUser());
	}

	@Test
	void testFindCurrentUserAuthenticated() {
		SecurityContext securityContext = mock(SecurityContext.class);
		Authentication authentication = mock(Authentication.class);
		when(authentication.getName()).thenReturn("john");
		when(securityContext.getAuthentication()).thenReturn(authentication);
		SecurityContextHolder.setContext(securityContext);

		User user = new User();
		user.setUsername("john");
		when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));

		User current = userService.findCurrentUser();
		assertEquals("john", current.getUsername());
		SecurityContextHolder.clearContext();
	}

	@Test
	void testExistsUser() {
		when(userRepository.existsByUsername("john")).thenReturn(true);
		assertTrue(userService.existsUser("john"));
	}

	@Test
	void testFindAll() {
		User user = new User();
		when(userRepository.findAll()).thenReturn(List.of(user));
		Iterable<User> users = userService.findAll();
		assertNotNull(users.iterator().next());
	}

	@Test
	void testFindAllByAuthority() {
		User user = new User();
		when(userRepository.findAllApprovedUsersByAuthority("ADMIN")).thenReturn(List.of(user));
		Iterable<User> users = userService.findAllByAuthority("ADMIN");
		assertNotNull(users.iterator().next());
	}

	@Test
	void testFindPendingUsers() {
		User user = new User();
		when(userRepository.findAllPendingUsers()).thenReturn(List.of(user));
		Iterable<User> users = userService.findPendingUsers();
		assertNotNull(users.iterator().next());
	}

	@Test
	void testFindApprovedUsers() {
		User user = new User();
		when(userRepository.findAllApprovedUsers()).thenReturn(List.of(user));
		Iterable<User> users = userService.findApprovedUsers();
		assertNotNull(users.iterator().next());
	}

	@Test
	void testUpdateUser() {
		User existing = new User();
		existing.setId(1);
		existing.setUsername("old");

		User updatedInfo = new User();
		updatedInfo.setUsername("new");
		updatedInfo.setFirstName("John");
		updatedInfo.setLastName("Doe");
		updatedInfo.setPersonalCode("4321");
		updatedInfo.setIsWorking(true);
		updatedInfo.setPassword("newpass");

		when(userRepository.findById(1)).thenReturn(Optional.of(existing));

		User updated = userService.updateUser(updatedInfo, 1);
		assertEquals("new", updated.getUsername());
		assertEquals("John", updated.getFirstName());
		assertEquals("Doe", updated.getLastName());
		assertEquals("4321", updated.getPersonalCode());
		assertTrue(updated.getIsWorking());
		assertEquals("newpass", updated.getPassword());
	}

	@Test
	void testDeleteUser() {
		User user = new User();
		user.setId(1);
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		userService.deleteUser(1);
		verify(userRepository, times(1)).delete(user);
	}

	@Test
	void testUpdateUserNotFound() {
		when(userRepository.findById(999)).thenReturn(Optional.empty());
		User dummy = new User();
		assertThrows(ResourceNotFoundException.class, () -> userService.updateUser(dummy, 999));
	}

	@Test
	void testDeleteUserNotFound() {
		when(userRepository.findById(999)).thenReturn(Optional.empty());
		assertThrows(ResourceNotFoundException.class, () -> userService.deleteUser(999));
	}

	@Test
	void testFindCurrentUserNullAuthentication() {
		SecurityContext securityContext = mock(SecurityContext.class);
		when(securityContext.getAuthentication()).thenReturn(null);
		SecurityContextHolder.setContext(securityContext);

		assertThrows(ResourceNotFoundException.class, () -> userService.findCurrentUser());
		SecurityContextHolder.clearContext();
	}
}
