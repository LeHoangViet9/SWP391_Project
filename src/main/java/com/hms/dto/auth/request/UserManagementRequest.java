package com.hms.dto.auth.request;

import com.hms.common.enums.AccountStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserManagementRequest {

    @NotBlank(message = "{user.fullname.notblank}")
    private String fullName;

    @NotBlank(message = "{user.username.notblank}")
    @Size(min = 4, max = 50, message = "{user.username.size}")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "{user.username.invalid}")
    private String userName;

    @Size(min = 6, message = "{user.password.size}")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@#$%^&+=!]{6,}$",
            message = "{user.password.invalid}"
    )
    private String password;

    private String rePassword;

    @NotBlank(message = "{user.email.notblank}")
    @Email(message = "{user.email.invalid}")
    private String email;

    @NotBlank(message = "{user.phone.notblank}")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "{user.phone.invalid}")
    private String phone;

    @NotBlank(message = "{error.role.invalid}")
    private String roleName;

    private AccountStatus accountStatus = AccountStatus.ACTIVE;
}
