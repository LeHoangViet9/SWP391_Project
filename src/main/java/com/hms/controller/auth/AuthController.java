package com.hms.controller.auth;

import com.hms.dto.auth.request.*;
import com.hms.common.dto.ApiResponse;
import com.hms.dto.auth.response.UserResponse;
import com.hms.service.auth.IAuthService;
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
    private final MessageSource messageSource;
    private final IAuthService authService;

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

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal String username) {
        Locale locale = LocaleContextHolder.getLocale();
        UserResponse userResponse = authService.getCurrentUser(username);
        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(messageSource.getMessage("auth.me.success", null, "Get current user successfully", locale))
                .data(userResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>>  handleChangePassword(@AuthenticationPrincipal String username,
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest){
        Locale locale= LocaleContextHolder.getLocale();
        String successMessage=messageSource.getMessage("auth.changePassword.success", null, locale);
        authService.changePassword(username,changePasswordRequest);
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
        authService.forgotPassword(forgotPasswordRequest);
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
        authService.resetPassword(resetPasswordRequest);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @PostMapping("/active-account")
    public ResponseEntity<ApiResponse<Void>> activeAccount(@Valid @RequestBody ActiveAccountRequest activeAccountRequest){
        Locale locale= LocaleContextHolder.getLocale();
        authService.activeUser(activeAccountRequest.getEmail(), activeAccountRequest.getOtp());
        String successMessage = messageSource.getMessage("auth.active.success", null, "Account activated successfully", locale);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                successMessage,
                null,
                HttpStatus.OK
        ),HttpStatus.OK);
    }




}
