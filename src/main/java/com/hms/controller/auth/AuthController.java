package com.hms.controller.auth;

import com.hms.dto.auth.request.*;
import com.hms.common.dto.ApiResponse;
import com.hms.dto.auth.response.UserResponse;
import com.hms.service.auth.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController

@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final IUserService userService;
    private final MessageSource messageSource;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> handleRegister(@Valid @RequestBody UserRegisterRequest registerRequest){
        Locale locale= LocaleContextHolder.getLocale();
        UserResponse userResponse = userService.registerNewUser(registerRequest);
        String successMessage = messageSource.getMessage("auth.register.success", null, locale);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(successMessage)
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> handleLogin(@Valid @RequestBody UserLoginRequest loginRequest){
        Locale locale= LocaleContextHolder.getLocale();
        userService.requestLoginOtp(loginRequest);
        String successMessage = "Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực để hoàn tất đăng nhập.";
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(successMessage)
                .data(null)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/login/verify")
    public ResponseEntity<ApiResponse<UserResponse>> handleVerifyLogin(@Valid @RequestBody LoginOtpRequest loginOtpRequest){
        Locale locale= LocaleContextHolder.getLocale();
        UserResponse userResponse = userService.verifyLoginOtp(loginOtpRequest);
        String successMessage = messageSource.getMessage("auth.login.success", null, locale);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(successMessage)
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>>  handleChangePassword(@AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.changePassword.success", null, locale);
        userService.changePassword(userDetails.getUsername(),changePasswordRequest);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK

        ),HttpStatus.OK);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.forgotPassword.success", null, locale);
        userService.forgotPassword(forgotPasswordRequest);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK
        ),HttpStatus.OK);
    }
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.resetPassword.success", null, locale);
        userService.resetPassword(resetPasswordRequest);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> handleResendOtp(@RequestParam String identifier) {
        userService.resendOtp(identifier);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã OTP mới đã được gửi.")
                .status(HttpStatus.OK)
                .build());
    }

    @PostMapping("/profile/resend-otp")
    public ResponseEntity<ApiResponse<Void>> handleResendProfileOtp(@AuthenticationPrincipal UserDetails userDetails) {
        userService.resendOtp(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã OTP mới đã được gửi đến email của bạn.")
                .status(HttpStatus.OK)
                .build());
    }

    @PostMapping("/profile/request-otp")
    public ResponseEntity<ApiResponse<Void>> handleRequestProfileOtp(@AuthenticationPrincipal UserDetails userDetails) {
        userService.resendOtp(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã OTP đã được gửi đến email của bạn.")
                .status(HttpStatus.OK)
                .build());
    }



}
