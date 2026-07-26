package com.hms.common.constant;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator generic cho annotation {@link PasswordMatch}.
 * Works with any DTO implementing {@link PasswordConfirmable}.
 */
public class PasswordMatchValidator implements ConstraintValidator<PasswordMatch, PasswordConfirmable> {

    @Override
    public boolean isValid(PasswordConfirmable value, ConstraintValidatorContext context) {
        if (value.getPassword() == null || value.getPassword().isBlank()) {
            return true; // Let @NotBlank on field handle this error
        }
        return value.getPassword().equals(value.getConfirmPassword());
    }
}
