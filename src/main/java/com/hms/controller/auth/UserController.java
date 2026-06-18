package com.hms.controller.auth;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.auth.request.UserManagementRequest;
import com.hms.dto.auth.response.UserResponse;
import com.hms.service.auth.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        ApiResponse<Page<UserResponse>> response = ApiResponse.<Page<UserResponse>>builder()
                .success(true)
                .message("Get user list successfully")
                .data(userService.getUsers(keywords, status, page, size, sortBy, direction))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody UserManagementRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(messageSource.getMessage("auth.register.success", null, locale))
                .data(userService.createUser(request))
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserManagementRequest request) {

        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Update user successfully")
                .data(userService.updateUser(id, request))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Delete user successfully")
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}
