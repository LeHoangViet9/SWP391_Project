package com.hms.dto.auth.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String roleName;
    private String token;
    private String accountStatus;
    private String workStatus;
    private LocalDateTime lastLoginAt;
    /** Danh sách mã quyền hạn (permission codes) dùng để lọc menu trên UI */
    private List<String> permissions;
}

