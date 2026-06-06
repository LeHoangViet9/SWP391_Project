package com.hms.common.constant;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Annotation xác thực mật khẩu và xác nhận mật khẩu phải khớp nhau.
 * Dùng cho bất kỳ class nào implement {@link PasswordConfirmable}.
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
