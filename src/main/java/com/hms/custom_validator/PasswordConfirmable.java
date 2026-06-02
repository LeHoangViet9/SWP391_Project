package com.hms.custom_validator;

/**
 * Interface đánh dấu cho các DTO cần xác thực mật khẩu xác nhận.
 * Implement interface này để dùng được annotation @PasswordMatch.
 */
public interface PasswordConfirmable {
    String getPassword();
    String getConfirmPassword();
}
