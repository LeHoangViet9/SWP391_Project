package com.hms.controller.auth;

import com.hms.dto.auth.request.UserLoginRequest;
import com.hms.dto.auth.request.UserRegisterRequest;
import com.hms.common.dto.ApiResponse;
import com.hms.dto.auth.response.UserResponse;
import com.hms.service.auth.IUserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController

@RequestMapping("/api/v1/auth")
public class AuthController {
    @Autowired
    private IUserService userService;
    @Autowired
    private MessageSource messageSource;

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



}
