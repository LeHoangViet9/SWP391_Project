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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        ApiResponse<Page<UserResponse>> response = ApiResponse.<Page<UserResponse>>builder()
                .success(true)
                .message("Get user list successfully")
                .data(userService.getUsers(id, fullName, email, phone, roleName, status, page, size, sortBy, direction))
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

    @PutMapping("/{userId}/permissions")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('USER_UPDATE')")
    public ResponseEntity<?> assignPermissionsToUser(
            @PathVariable Long userId,
            @RequestBody Map<String, List<Long>> request
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        UserResponse response = userService.assignPermissionsToUser(
                userId,
                request.get("permissionIds")
        );
        return ResponseEntity.ok(Map.of(
                "message", messageSource.getMessage("success.user.assign.permissions", null, locale),
                "data", response
        ));
    }

    // ✅ THÊM MỚI: Xóa quyền riêng khỏi user
    @DeleteMapping("/{userId}/permissions")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('USER_UPDATE')")
    public ResponseEntity<?> removePermissionsFromUser(
            @PathVariable Long userId,
            @RequestBody Map<String, List<Long>> request
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        UserResponse response = userService.removePermissionsFromUser(
                userId,
                request.get("permissionIds")
        );
        return ResponseEntity.ok(Map.of(
                "message", messageSource.getMessage("success.user.remove.permissions", null, locale),
                "data", response
        ));
    }

    @GetMapping("/{userId}/permissions")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('USER_VIEW')")
    public ResponseEntity<?> getUserPermissions(@PathVariable Long userId) {
        Locale locale = LocaleContextHolder.getLocale();
        UserResponse response = userService.getUserPermissions(userId);
        return ResponseEntity.ok(Map.of(
                "message", messageSource.getMessage("success.user.get.permissions", null, locale),
                "data", response
        ));
    }
}
