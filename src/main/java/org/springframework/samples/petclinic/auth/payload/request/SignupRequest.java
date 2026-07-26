package org.springframework.samples.petclinic.auth.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
	
	@NotBlank
	private String username;
	
	@NotBlank
	private String authority;

	@NotBlank
	private String password;
	
	@NotBlank
	private String firstName;
	
	@NotBlank
	private String lastName;

	@NotBlank
	@Size(min = 4, max = 4)
	@Pattern(regexp = "\\d{4}", message = "Personal code must be exactly 4 digits")
	private String personalCode;

}
