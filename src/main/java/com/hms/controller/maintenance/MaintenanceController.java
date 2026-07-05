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

    @GetMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_VIEW')")
    public ApiResponse<Page<MaintenanceResponse>> getAllRequests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MaintenanceSeverity severity,
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction
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
}