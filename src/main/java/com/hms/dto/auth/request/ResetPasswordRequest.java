package com.hms.dto.auth.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ResetPasswordRequest {
    @NotBlank(message = "{user.token.notblank}")
    private String token;

    @NotBlank(message = "{user.password.notblank}")
    @Size(min = 6, message = "{user.password.size}")
    private String newPassword;

    @NotBlank(message = "{user.confirmPassword.notblank}")
    private String confirmPassword;
}
