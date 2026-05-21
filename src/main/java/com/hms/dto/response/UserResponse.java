package com.hms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
