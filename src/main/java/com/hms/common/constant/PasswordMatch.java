package com.hms.common.constant;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation validating password and password confirmation match.
 * Used for any class implementing {@link PasswordConfirmable}.
 */
@Constraint(validatedBy = PasswordMatchValidator.class)
@Target({
        TYPE,
        ANNOTATION_TYPE
})
@Retention(RUNTIME)
public @interface PasswordMatch {
    String message() default "{user.repassword.message}";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}
