package com.hms.custom_validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Constraint(validatedBy = PasswordMatchValidator.class)
@Target({
        TYPE,
        ANNOTATION_TYPE
})
@Retention(RUNTIME)
public @interface RePasswordMatch {
    String message() default "{user.repassword.message}";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}
