package org.springframework.samples.smartcheckin.validation.spel;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = SpelConstraintValidator.class)
@Target({ElementType.TYPE, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidateElementIn {

    String message() default "Element must be in the specified collection";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    String element();

    String collection();
}
