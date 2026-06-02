package com.hms.dto.auth.request;

import com.hms.custom_validator.PasswordConfirmable;
import com.hms.custom_validator.PasswordMatch;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;


@PasswordMatch
@Data
public class UserRegisterRequest implements PasswordConfirmable {
    @NotBlank(message = "{user.fullname.notblank}")
    private String fullName;

    @NotBlank(message = "{user.username.notblank}")
    @Size(min = 4, max = 50, message = "{user.username.size}")
    @Pattern(
            regexp = "^[a-zA-Z0-9_]+$",
            message = "{user.username.invalid}"
    )
    private String userName;

    @NotBlank(message = "{user.password.notblank}")
    @Size(min = 6, message = "{user.password.size}")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@#$%^&+=!]{6,}$",
            message = "{user.password.invalid}"
    )
    private String password;

    @NotBlank(message = "{user.repassword.message}")
    private String rePassword;

    @NotBlank(message = "{user.email.notblank}")
    @Email(message = "{user.email.invalid}")
    private String email;

    @NotBlank(message = "{user.phone.notblank}")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "{user.phone.invalid}")
    private String phone;

    // Implement PasswordConfirmable interface
    @Override
    public String getConfirmPassword() {
        return this.rePassword;
    }
}
