package com.hms.controller.maintenance;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.service.maintenance.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/maintenance-requests")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;
    private final MessageSource messageSource;

    // THAY ĐỔI: Sử dụng phân quyền dựa trên Authority ('MAINTENANCE_CREATE') thay cho Role ('HOUSEKEEPING'...)
    // giúp đồng bộ hóa phân quyền và hỗ trợ vai trò HOUSEKEEPER/MANAGER tạo phiếu bảo trì thành công
    @PostMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_CREATE')")
    public ApiResponse<MaintenanceResponse> createRequest(
            @Valid @RequestBody MaintenanceRequestCreateDTO dto
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage(
                        "maintenance.create.success",
                        null,
                        locale
                ),
                maintenanceService.createRequest(dto)
        );
    }

    // THAY ĐỔI: Đổi defaultValue của sortBy thành CREATED_AT và direction thành DESC để mặc định hiển thị ngày mới nhất trước
    @GetMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_VIEW')")
    public ApiResponse<Page<MaintenanceResponse>> getAllRequests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MaintenanceSeverity severity,
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "CREATED_AT") SortField sortBy,
            @RequestParam(defaultValue = "DESC") SortDirection direction
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage(
                        "maintenance.getall.success",
                        null,
                        locale
                ),
                maintenanceService.getAllRequests(
                        keyword,
                        severity,
                        status,
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_VIEW')")
    public ApiResponse<MaintenanceResponse> getRequestById(
            @PathVariable Long id
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage(
                        "maintenance.getbyid.success",
                        null,
                        locale
                ),
                maintenanceService.getRequestById(id)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_UPDATE')")
    public ApiResponse<MaintenanceResponse> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRequestUpdateDTO dto
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage(
                        "maintenance.update.success",
                        null,
                        locale
                ),
                maintenanceService.updateRequest(id, dto)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_DELETE')")
    public ApiResponse<Void> deleteRequest(
            @PathVariable Long id
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        maintenanceService.deleteRequest(id);

        return ApiResponse.success(
                messageSource.getMessage(
                        "maintenance.delete.success",
                        null,
                        locale
                )
        );
    }

    /**
     * Maintenance staff CHẤP NHẬN yêu cầu → IN_PROGRESS
     * POST /api/v1/maintenance-requests/{id}/accept?userId={maintenanceUserId}
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAuthority('MAINTENANCE_UPDATE')")
    public ApiResponse<MaintenanceResponse> acceptRequest(
            @PathVariable Long id
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        return ApiResponse.success(
                messageSource.getMessage("maintenance.update.success", null, locale),
                maintenanceService.acceptRequest(id)
        );
    }

    /**
     * Maintenance staff TỪ CHỐI yêu cầu → hệ thống tìm người tiếp theo
     * POST /api/v1/maintenance-requests/{id}/deny?userId={maintenanceUserId}
     */
    // THAY ĐỔI: Nhận thêm param lý do từ chối (reason) để lưu vết vào chẩn đoán (diagnosis)
    @PostMapping("/{id}/deny")
    @PreAuthorize("hasAuthority('MAINTENANCE_UPDATE')")
    public ApiResponse<MaintenanceResponse> denyRequest(
            @PathVariable Long id,
            @RequestParam(required = false) String reason
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        return ApiResponse.success(
                messageSource.getMessage("maintenance.update.success", null, locale),
                maintenanceService.denyRequest(id, reason)
        );
    }
}
