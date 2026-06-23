package com.hms.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLoginRequest {
    @NotBlank(message = "{login.email.notblank}")
    private String email;

    @NotBlank(message = "{login.password.notblank}")
    private String password;
}
