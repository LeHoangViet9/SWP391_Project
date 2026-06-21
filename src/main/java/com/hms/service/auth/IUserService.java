package com.hms.service.auth;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IUserService {


    Page<UserResponse> getUsers(
            Long id,
            String fullName,
            String email,
            String phone,
            String roleName,
            AccountStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    UserResponse createUser(UserManagementRequest request);

    UserResponse updateUser(Long id, UserManagementRequest request);

    void deleteUser(Long id);

    UserResponse assignPermissionsToUser(Long userId, List<Long> permissionIds);
    UserResponse removePermissionsFromUser(Long userId, List<Long> permissionIds);
    UserResponse getUserPermissions(Long userId);


<<<<<<< HEAD
=======
    void resendOtp(String email);

    UserResponse assignPermissionsToUser(Long userId, java.util.List<Long> permissionIds);

    UserResponse removePermissionsFromUser(Long userId, java.util.List<Long> permissionIds);

    UserResponse getUserPermissions(Long userId);
>>>>>>> e040e79 (update login)
}
