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
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/maintenance-requests")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    /*
     * Chức năng:
     * Tạo yêu cầu bảo trì mới.
     *
     * Theo nghiệp vụ thầy nhắc:
     * Request phải gắn với phòng hoặc thiết bị.
     * Phần kiểm tra roomId/equipmentId nằm trong MaintenanceServiceImpl.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE')")
    public ApiResponse<MaintenanceResponse> createRequest(
            @Valid @RequestBody MaintenanceRequestCreateDTO dto
    ) {
        return ApiResponse.success(
                "Create maintenance request successfully",
                maintenanceService.createRequest(dto)
        );
    }

    /*
     * Chức năng:
     * Lấy danh sách yêu cầu bảo trì.
     *
     * Có thể lọc theo:
     * - id
     * - issueTitle
     * - roomId
     * - equipmentId
     * - reportedBy
     * - assignedTo
     * - severity
     * - status
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MAINTENANCE')")
    public ApiResponse<Page<MaintenanceResponse>> getAllRequests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MaintenanceSeverity severity,
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction
    ) {
        return ApiResponse.success(
                "Get maintenance request list successfully",
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

    /*
     * Chức năng:
     * Xem chi tiết một yêu cầu bảo trì theo id.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'MAINTENANCE')")
    public ApiResponse<MaintenanceResponse> getRequestById(
            @PathVariable Long id
    ) {
        return ApiResponse.success(
                "Get maintenance request successfully",
                maintenanceService.getRequestById(id)
        );
    }

    /*
     * Chức năng:
     * Cập nhật yêu cầu bảo trì.
     *
     * Dùng cho:
     * - Gán nhân viên bảo trì
     * - Cập nhật severity
     * - Cập nhật status
     * - Ghi diagnosis
     * - Ghi repairResult
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAINTENANCE')")
    public ApiResponse<MaintenanceResponse> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRequestUpdateDTO dto
    ) {
        return ApiResponse.success(
                "Update maintenance request successfully",
                maintenanceService.updateRequest(id, dto)
        );
    }

    /*
     * Chức năng:
     * Xóa yêu cầu bảo trì.
     *
     * Hiện chỉ ADMIN được xóa.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteRequest(
            @PathVariable Long id
    ) {
        maintenanceService.deleteRequest(id);

        return ApiResponse.success("Delete maintenance request successfully");
    }
}