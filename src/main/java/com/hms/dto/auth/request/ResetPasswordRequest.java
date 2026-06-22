package com.hms.dto.auth.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "{user.token.notblank}")
    private String token;

    @NotBlank(message = "{user.password.notblank}")
    @Size(min = 6, message = "{user.password.size}")
    private String newPassword;

    @NotBlank(message = "{user.confirmPassword.notblank}")
    private String confirmPassword;
}
