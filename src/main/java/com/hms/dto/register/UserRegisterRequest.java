package com.hms.dto.register;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRegisterRequest {
    @NotBlank(message = "{user.fullname.notblank}")
    private String fullName;

    @NotBlank(message = "{user.username.notblank}")
    @Size(min = 4, max = 50, message = "{user.username.size}")
    private String username;

    @NotBlank(message = "{user.password.notblank}")
    @Size(min = 6, message = "{user.password.size}")
    private String password;

    @NotBlank(message = "{user.email.notblank}")
    @Email(message = "{user.email.invalid}")
    private String email;

    @NotBlank(message = "{user.phone.notblank}")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "{user.phone.invalid}")
    private String phone;

    private String roleName;
}
