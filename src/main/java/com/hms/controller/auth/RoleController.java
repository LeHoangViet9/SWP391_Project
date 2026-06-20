package com.hms.controller.auth;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.auth.request.RoleRequest;
import com.hms.dto.auth.response.RoleResponse;
import com.hms.service.auth.IRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final IRoleService roleService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<List<RoleResponse>> response = ApiResponse.<List<RoleResponse>>builder()
                .success(true)
                .message(messageSource.getMessage("success.role.getall", null, locale))
                .data(roleService.getAllRoles())
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<RoleResponse> response = ApiResponse.<RoleResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.role.getbyid", null, locale))
                .data(roleService.getRoleById(id))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(
            @Valid @RequestBody RoleRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<RoleResponse> response = ApiResponse.<RoleResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.role.create", null, locale))
                .data(roleService.createRole(request))
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<RoleResponse> response = ApiResponse.<RoleResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.role.update", null, locale))
                .data(roleService.updateRole(id, request))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        roleService.deleteRole(id);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(messageSource.getMessage("success.role.delete", null, locale))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{roleId}/permissions")
    public ResponseEntity<ApiResponse<RoleResponse>> assignPermissionsToRole(
            @PathVariable Long roleId,
            @RequestBody List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();

        ApiResponse<RoleResponse> response = ApiResponse.<RoleResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.role.assign.permissions", null, locale))
                .data(roleService.assignPermissionsToRole(roleId, permissionIds))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}