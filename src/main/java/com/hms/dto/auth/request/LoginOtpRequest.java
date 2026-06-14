package com.hms.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginOtpRequest {
    @NotBlank(message = "{login.username.notblank}")
    private String username;

    @NotBlank(message = "{user.otp.notblank}")
    private String otp;
}
