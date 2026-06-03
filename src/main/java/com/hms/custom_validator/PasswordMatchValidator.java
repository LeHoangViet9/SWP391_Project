package com.hms.custom_validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator generic cho annotation {@link PasswordMatch}.
 * Hoạt động với bất kỳ DTO nào implement {@link PasswordConfirmable}.
 */
public class PasswordMatchValidator implements ConstraintValidator<PasswordMatch, PasswordConfirmable> {

    @Override
    public boolean isValid(PasswordConfirmable value, ConstraintValidatorContext context) {
        if (value.getPassword() == null || value.getPassword().isBlank()) {
            return true; // Để @NotBlank trên field tự xử lý lỗi này
        }
        return value.getPassword().equals(value.getConfirmPassword());
    }
}
