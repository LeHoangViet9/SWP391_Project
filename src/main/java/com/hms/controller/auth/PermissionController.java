package com.hms.controller.auth;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.auth.request.PermissionRequest;
import com.hms.dto.auth.response.PermissionResponse;
import com.hms.service.auth.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PermissionController {

    private final PermissionService permissionService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<List<PermissionResponse>> response = ApiResponse.<List<PermissionResponse>>builder()
                .success(true)
                .message(messageSource.getMessage("success.permission.getall", null, locale))
                .data(permissionService.getAllPermissions())
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(
            @Valid @RequestBody PermissionRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<PermissionResponse> response = ApiResponse.<PermissionResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.permission.create", null, locale))
                .data(permissionService.createPermission(request))
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PermissionResponse>> updatePermission(
            @PathVariable Long id,
            @Valid @RequestBody PermissionRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<PermissionResponse> response = ApiResponse.<PermissionResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.permission.update", null, locale))
                .data(permissionService.updatePermission(id, request))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        permissionService.deletePermission(id);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(messageSource.getMessage("success.permission.delete", null, locale))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}