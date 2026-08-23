package org.springframework.samples.smartcheckin.formation;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class FormationValidationTests {

    private Validator validator;

    @BeforeEach
    void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    private Formation createValidFormation() {
        Formation formation = new Formation();
        formation.setName("Valid Formation");
        formation.setDescription("Valid Description");
        formation.setFormationDate(LocalDateTime.now().plusDays(2));
        return formation;
    }

    @Test
    void shouldNotValidateWhenNameIsBlank() {
        Formation formation = createValidFormation();
        formation.setName("   ");

        Set<ConstraintViolation<Formation>> violations = validator.validate(formation);
        assertThat(violations).isNotEmpty();
    }

    @Test
    void shouldNotValidateWhenDateIsNull() {
        Formation formation = createValidFormation();
        formation.setFormationDate(null);

        Set<ConstraintViolation<Formation>> violations = validator.validate(formation);
        assertThat(violations).isNotEmpty();
    }

    @Test
    void shouldValidateValidFormation() {
        Formation formation = createValidFormation();
        Set<ConstraintViolation<Formation>> violations = validator.validate(formation);
        assertThat(violations).isEmpty();
    }
}
