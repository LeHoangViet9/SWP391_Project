package com.hms.service.auth;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;
import org.springframework.data.domain.Page;

public interface IUserService {
    UserResponse registerNewUser(UserRegisterRequest registerRequest);
    UserResponse login(UserLoginRequest loginRequest);
    UserResponse getCurrentUser(String email);
    void changePassword(String email, ChangePasswordRequest changePasswordRequest);
    void forgotPassword(
            ForgotPasswordRequest request
    );

    void resetPassword(
            ResetPasswordRequest request
    );

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

    UserResponse verifyOtp(VerifyOtpRequest request);

    void resendOtp(String email);
}
