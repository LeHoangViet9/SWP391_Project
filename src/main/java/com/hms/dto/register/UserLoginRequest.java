package com.hms.dto.register;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLoginRequest {
    @NotBlank(message = "{login.username.notblank}")
    private String username;

    @NotBlank(message = "{login.password.notblank}")
    private String password;
}
