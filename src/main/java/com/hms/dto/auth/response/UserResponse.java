package com.hms.dto.auth.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserResponse {
    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String roleName;
    private String token;
    private String accountStatus;
    private LocalDateTime lastLoginAt;
}
