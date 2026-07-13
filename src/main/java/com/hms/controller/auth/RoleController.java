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
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('USER_AUTHORIZE')")
public class RoleController {

    private final IRoleService roleService;
    private final MessageSource messageSource;

    /**
     * API lấy danh sách toàn bộ các vai trò (Roles) trong hệ thống.
     * Endpoint: GET /api/v1/roles
     * Yêu cầu quyền: USER_AUTHORIZE
     *
     * @return danh sách vai trò bọc trong đối tượng ApiResponse
     */
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

    /**
     * API lấy thông tin chi tiết một vai trò theo ID.
     * Endpoint: GET /api/v1/roles/{id}
     * Yêu cầu quyền: USER_AUTHORIZE
     *
     * @param id của vai trò cần lấy thông tin
     * @return thông tin chi tiết vai trò bọc trong đối tượng ApiResponse
     */
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

    /**
     * API tạo mới một vai trò mới kèm theo danh sách quyền hạn.
     * Endpoint: POST /api/v1/roles
     * Yêu cầu quyền: USER_AUTHORIZE
     *
     * @param request chứa thông tin vai trò mới
     * @return vai trò mới được tạo bọc trong đối tượng ApiResponse
     */
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

    /**
     * API cập nhật thông tin vai trò hiện tại theo ID.
     * Endpoint: PUT /api/v1/roles/{id}
     * Yêu cầu quyền: USER_AUTHORIZE
     *
     * @param id của vai trò cần cập nhật
     * @param request chứa thông tin mới của vai trò
     * @return vai trò sau khi cập nhật bọc trong đối tượng ApiResponse
     */
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

    /**
     * API xóa vai trò dựa trên ID.
     * Endpoint: DELETE /api/v1/roles/{id}
     * Yêu cầu quyền: USER_AUTHORIZE
     *
     * @param id của vai trò cần xóa
     * @return phản hồi trống bọc trong đối tượng ApiResponse
     */
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

    /**
     * API gán danh sách quyền hạn (Permissions) cho vai trò.
     * Endpoint: PUT /api/v1/roles/{roleId}/permissions
     * Yêu cầu quyền: USER_AUTHORIZE
     *
     * @param roleId của vai trò cần gán quyền
     * @param permissionIds danh sách các ID quyền hạn cần gán
     * @return vai trò đã cập nhật danh sách quyền bọc trong đối tượng ApiResponse
     */
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
