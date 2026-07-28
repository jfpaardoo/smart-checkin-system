package org.springframework.samples.smartcheckin.user;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@SuppressWarnings("null")
public class UserService {

	private UserRepository userRepository;

	@Autowired
	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional
	public User saveUser(User user) throws DataAccessException {
		userRepository.save(user);
		return user;
	}

	@Transactional(readOnly = true)
	public User findUser(String username) {
		return userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
	}

	@Transactional(readOnly = true)
	public User findUser(Integer id) {
		return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
	}

	@Transactional(readOnly = true)
	public User findByPersonalCode(String personalCode) {
		return userRepository.findByPersonalCode(personalCode)
				.orElseThrow(() -> new ResourceNotFoundException("User", "personalCode", personalCode));
	}

	@Transactional(readOnly = true)
	public User findCurrentUser() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null)
			throw new ResourceNotFoundException("Nobody authenticated!");
		else
			return userRepository.findByUsername(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException("User", "Username", auth.getName()));
	}

	public Boolean existsUser(String username) {
		return userRepository.existsByUsername(username);
	}

	@Transactional(readOnly = true)
	public Iterable<User> findAll() {
		return userRepository.findAll();
	}

	public Iterable<User> findAllByAuthority(String auth) {
		return userRepository.findAllApprovedUsersByAuthority(auth);
	}

	@Transactional(readOnly = true)
	public Iterable<User> findPendingUsers() {
		return userRepository.findAllPendingUsers();
	}

	@Transactional(readOnly = true)
	public Iterable<User> findApprovedUsers() {
		return userRepository.findAllApprovedUsers();
	}

	@Transactional
	public User updateUser(@Valid User user, Integer idToUpdate) {
		User toUpdate = userRepository.findById(idToUpdate).orElseThrow(() -> new ResourceNotFoundException("User", "id", idToUpdate));
		
		toUpdate.setUsername(user.getUsername());
		toUpdate.setFirstName(user.getFirstName());
		toUpdate.setLastName(user.getLastName());
		toUpdate.setPersonalCode(user.getPersonalCode());
		toUpdate.setIsWorking(user.getIsWorking());
		toUpdate.setAuthority(user.getAuthority());
		
		if (user.getPassword() != null && !user.getPassword().isEmpty()) {
			toUpdate.setPassword(user.getPassword());
		}
		
		userRepository.save(toUpdate);
		return toUpdate;
	}

	@Transactional
	public void deleteUser(Integer id) {
		User toDelete = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
		this.userRepository.delete(toDelete);
	}

}
