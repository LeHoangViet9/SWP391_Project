package com.hms.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLoginRequest {
    @NotBlank(message = "{login.email.notblank}")
    @Email(message = "{login.email.invalid}")
    private String email;

    @NotBlank(message = "{login.password.notblank}")
    private String password;
}
