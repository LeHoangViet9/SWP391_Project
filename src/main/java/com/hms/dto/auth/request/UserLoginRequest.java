package com.hms.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLoginRequest {
    @NotBlank(message = "{login.username.notblank}")
    private String username;

    @NotBlank(message = "{login.password.notblank}")
    private String password;
}
