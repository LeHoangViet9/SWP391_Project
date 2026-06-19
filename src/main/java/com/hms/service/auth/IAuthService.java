package com.hms.service.auth;

import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;

public interface IAuthService {
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

    void verifyOtp(VerifyOtpRequest request);

    void resendOtp(String email);
}
