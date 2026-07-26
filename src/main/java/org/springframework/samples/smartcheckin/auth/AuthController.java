package org.springframework.samples.smartcheckin.auth;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.auth.payload.request.LoginRequest;
import org.springframework.samples.smartcheckin.auth.payload.response.JwtResponse;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.authentication.BadCredentialsException;


@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "The Authentication API based on JWT")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final UserService userService;
	private final JwtUtils jwtUtils;

	@Autowired
	public AuthController(AuthenticationManager authenticationManager, UserService userService, JwtUtils jwtUtils) {
		this.userService = userService;
		this.jwtUtils = jwtUtils;
		this.authenticationManager = authenticationManager;
	}

	@PostMapping("/signin")
	public ResponseEntity<Object> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
		
		User user = null;
		try {
			user = userService.findUser(loginRequest.getUsername());
		} catch (ResourceNotFoundException e) {
			// Do nothing to avoid username enumeration, just let it fail later or return bad credentials
		}

		ResponseEntity<Object> lockoutResponse = checkLockout(user);
		if (lockoutResponse != null) {
			return lockoutResponse;
		}

		try{
			Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

			SecurityContextHolder.getContext().setAuthentication(authentication);
			String jwt = jwtUtils.generateJwtToken(authentication);

			UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
			List<String> roles = userDetails.getAuthorities().stream().map(item -> item.getAuthority())
				.toList();

			if (user != null && user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
				user.setFailedLoginAttempts(0);
				userService.saveUser(user);
			}

			return ResponseEntity.ok().body(new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), roles));
		}catch(BadCredentialsException exception){
			handleFailedLogin(user);
			return ResponseEntity.badRequest().body("Bad Credentials!");
		}
	}

	private ResponseEntity<Object> checkLockout(User user) {
		if (user != null && user.getAccountLockedUntil() != null) {
			if (user.getAccountLockedUntil().isAfter(LocalDateTime.now(java.time.ZoneId.systemDefault()))) {
				return ResponseEntity.status(403).body("Account is locked due to too many failed attempts. Try again later.");
			} else {
				user.setAccountLockedUntil(null);
				user.setFailedLoginAttempts(0);
				userService.saveUser(user);
			}
		}
		return null;
	}

	private void handleFailedLogin(User user) {
		if (user != null) {
			int attempts = user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts();
			attempts++;
			user.setFailedLoginAttempts(attempts);
			if (attempts >= 5) {
				user.setAccountLockedUntil(LocalDateTime.now(ZoneId.systemDefault()).plusMinutes(15));
			}
			userService.saveUser(user);
		}
	}

	@GetMapping("/validate")
	public ResponseEntity<Boolean> validateToken(@RequestParam String token) {
		Boolean isValid = jwtUtils.validateJwtToken(token);
		return ResponseEntity.ok(isValid);
	}

	@GetMapping("/public-key")
	public ResponseEntity<String> getPublicKey() {
		return ResponseEntity.ok(jwtUtils.getPublicKeyBase64());
	}
}
