package com.hms.controller.auth;

import com.hms.dto.auth.request.*;
import com.hms.common.dto.ApiResponse;
import com.hms.dto.auth.response.UserResponse;
import com.hms.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController

@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final MessageSource messageSource;
    private final AuthService authService;

    /**
     * API đăng ký người dùng mới.
     * Endpoint: POST /api/v1/auth/register
     *
     * @param registerRequest chứa thông tin đăng ký (email, mật khẩu, tên...)
     * @return thông tin người dùng đã tạo bọc trong ApiResponse
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> handleRegister(@Valid @RequestBody UserRegisterRequest registerRequest){
        Locale locale= LocaleContextHolder.getLocale();
        UserResponse userResponse = authService.registerNewUser(registerRequest);
        String successMessage = messageSource.getMessage("auth.register.success", null, locale);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(successMessage)
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * API đăng nhập hệ thống.
     * Endpoint: POST /api/v1/auth/login
     *
     * @param loginRequest chứa thông tin email và mật khẩu đăng nhập
     * @return thông tin đăng nhập thành công bao gồm Access Token bọc trong ApiResponse
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> handleLogin(@Valid @RequestBody UserLoginRequest loginRequest){
        Locale locale= LocaleContextHolder.getLocale();
        UserResponse userResponse = authService.login(loginRequest);
        String successMessage = messageSource.getMessage("auth.login.success", null, locale);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(successMessage)
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * API lấy thông tin người dùng hiện tại từ Authentication context.
     * Endpoint: GET /api/v1/auth/me
     * Yêu cầu xác thực.
     *
     * @param email của người dùng hiện tại lấy từ principal
     * @return thông tin chi tiết người dùng bọc trong ApiResponse
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal String email) {
        Locale locale = LocaleContextHolder.getLocale();
        UserResponse userResponse = authService.getCurrentUser(email);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(messageSource.getMessage("auth.me.success", null, "Get current user successfully", locale))
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.ok(response);
    }

    /**
     * API thay đổi mật khẩu của người dùng hiện tại.
     * Endpoint: PUT /api/v1/auth/change-password
     * Yêu cầu xác thực.
     *
     * @param email của người dùng hiện tại lấy từ principal
     * @param changePasswordRequest chứa mật khẩu cũ và mật khẩu mới
     * @return phản hồi thành công bọc trong ApiResponse
     */
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>>  handleChangePassword(@AuthenticationPrincipal String email,
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.changePassword.success", null, locale);
        authService.changePassword(email,changePasswordRequest);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK

        ),HttpStatus.OK);
    }

    /**
     * API yêu cầu đặt lại mật khẩu khi quên (gửi OTP đến email).
     * Endpoint: POST /api/v1/auth/forgot-password
     *
     * @param forgotPasswordRequest chứa email cần đặt lại mật khẩu
     * @return phản hồi gửi OTP thành công bọc trong ApiResponse
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.forgotPassword.success", null, locale);
        authService.forgotPassword(forgotPasswordRequest);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    /**
     * API đặt lại mật khẩu mới sử dụng mã xác thực OTP.
     * Endpoint: POST /api/v1/auth/reset-password
     *
     * @param resetPasswordRequest chứa email, OTP và mật khẩu mới
     * @return phản hồi đặt lại mật khẩu thành công bọc trong ApiResponse
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.resetPassword.success", null, locale);
        authService.resetPassword(resetPasswordRequest);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    /**
     * API xác thực OTP (thường dùng khi kích hoạt tài khoản hoặc xác minh giao dịch).
     * Endpoint: POST /api/v1/auth/verify-otp
     *
     * @param request chứa email và mã OTP cần xác thực
     * @return phản hồi xác thực thành công bọc trong ApiResponse
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        authService.verifyOtp(request);
        String successMessage = messageSource.getMessage("auth.verifyOtp.success", null, locale);
        return ResponseEntity.ok(new ApiResponse<>(true, successMessage, null, HttpStatus.OK));
    }

    /**
     * API yêu cầu gửi lại mã OTP vào email của người dùng.
     * Endpoint: POST /api/v1/auth/resend-otp
     *
     * @param email cần gửi lại mã OTP
     * @return phản hồi gửi lại OTP thành công bọc trong ApiResponse
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@RequestParam String email){
        Locale locale = LocaleContextHolder.getLocale();
        authService.resendOtp(email);
        String successMessage = messageSource.getMessage("auth.resendOtp.success", null, locale);
        return ResponseEntity.ok(new ApiResponse<>(true, successMessage, null, HttpStatus.OK));
    }
}
