package com.hms.controller.maintenance;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.service.maintenance.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/maintenance-requests")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @PostMapping
    public ApiResponse<MaintenanceResponse> createRequest(
            @Valid @RequestBody MaintenanceRequestCreateDTO dto
    ) {
        return ApiResponse.success(
                "Create maintenance request successfully",
                maintenanceService.createRequest(dto)
        );
    }

    @GetMapping
    public ApiResponse<Page<MaintenanceResponse>> getAllRequests(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String issueTitle,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long equipmentId,
            @RequestParam(required = false) Long reportedBy,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) com.hms.common.enums.MaintenanceSeverity severity,
            @RequestParam(required = false) com.hms.common.enums.MaintenanceStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction
    ) {
        return ApiResponse.success(
                "Get maintenance request list successfully",
                maintenanceService.getAllRequests(
                        id,
                        issueTitle,
                        roomId,
                        equipmentId,
                        reportedBy,
                        assignedTo,
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
    public ApiResponse<MaintenanceResponse> getRequestById(
            @PathVariable Long id
    ) {
        return ApiResponse.success(
                "Get maintenance request successfully",
                maintenanceService.getRequestById(id)
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<MaintenanceResponse> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRequestUpdateDTO dto
    ) {
        return ApiResponse.success(
                "Update maintenance request successfully",
                maintenanceService.updateRequest(id, dto)
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRequest(
            @PathVariable Long id
    ) {
        maintenanceService.deleteRequest(id);

        return ApiResponse.success("Delete maintenance request successfully");
    }
}