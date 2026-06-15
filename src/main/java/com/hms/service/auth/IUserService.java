package com.hms.service.auth;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;
import org.springframework.data.domain.Page;

public interface IUserService {

    Page<UserResponse> getUsers(String keywords, AccountStatus status, Integer page, Integer size, SortField sortBy, SortDirection direction);

    UserResponse createUser(UserManagementRequest request);

    UserResponse updateUser(Long id, UserManagementRequest request);

    void deleteUser(Long id);

    void activeUser(String email, String otpCode);
}
