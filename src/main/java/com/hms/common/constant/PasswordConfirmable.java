package com.hms.common.constant;

/**
 * Marker interface for DTOs needing confirm password validation.
 * Implement this interface to use annotation @PasswordMatch.
 */
public interface PasswordConfirmable {
    String getPassword();
    String getConfirmPassword();
}
