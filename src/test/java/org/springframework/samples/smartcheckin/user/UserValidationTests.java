package org.springframework.samples.smartcheckin.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class UserValidationTests {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private User createValidUser() {
        User user = new User();
        user.setUsername("validUser");
        user.setPassword("password123");
        user.setPersonalCode("1234");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("test@example.com");

        Authorities auth = new Authorities();
        auth.setAuthority("USER");
        user.setAuthority(auth);

        return user;
    }

    @Test
    void shouldNotValidateWhenUsernameEmpty() {
        User user = createValidUser();
        user.setUsername("");

        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertThat(violations).isNotEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"123", "12345"})
    void shouldNotValidateWhenPersonalCodeLengthIsInvalid(String invalidCode) {
        User user = createValidUser();
        user.setPersonalCode(invalidCode);

        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertThat(violations).isNotEmpty();
    }

    @Test
    void shouldValidateValidUser() {
        User user = createValidUser();
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        assertThat(violations).isEmpty();
    }
}
