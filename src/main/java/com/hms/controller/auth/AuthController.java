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
    public ResponseEntity<ApiResponse<UserResponse>> handleLogin(@Valid @RequestBody UserLoginRequest loginRequest){
        Locale locale= LocaleContextHolder.getLocale();
        UserResponse userResponse = userService.login(loginRequest);
        String successMessage = messageSource.getMessage("auth.login.success", null, locale);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(successMessage)
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal String email) {
        Locale locale = LocaleContextHolder.getLocale();
        UserResponse userResponse = userService.getCurrentUser(email);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(messageSource.getMessage("auth.me.success", null, "Get current user successfully", locale))
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>>  handleChangePassword(@AuthenticationPrincipal String email,
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.changePassword.success", null, locale);
        userService.changePassword(email,changePasswordRequest);
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

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        userService.verifyOtp(request);
        String successMessage = messageSource.getMessage("auth.verifyOtp.success", null, locale);
        return ResponseEntity.ok(new ApiResponse<>(true, successMessage, null, HttpStatus.OK));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@RequestParam String email){
        Locale locale = LocaleContextHolder.getLocale();
        userService.resendOtp(email);
        String successMessage = messageSource.getMessage("auth.resendOtp.success", null, locale);
        return ResponseEntity.ok(new ApiResponse<>(true, successMessage, null, HttpStatus.OK));
    }
}
