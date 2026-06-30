package com.hms.controller.dashboard;


import com.hms.common.dto.ApiResponse;
import com.hms.dto.dashboard.response.AdminDashboardResponse;
import com.hms.dto.dashboard.response.HouseKeepingDashboardResponse;
import com.hms.dto.dashboard.response.MaintenanceDashboardResponse;
import com.hms.dto.dashboard.response.ReceptionistDashboardResponse;
import com.hms.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/dashboards")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAuthority('DASHBOARD_VIEW')")
    public ResponseEntity<ApiResponse<Object>> getDashboard(@AuthenticationPrincipal String email) {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "Dashboard data retrieved successfully",
                dashboardService.getDashboardData(email),
                HttpStatus.OK
        ), HttpStatus.OK);
    }
    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "Admin dashboard data retrieved successfully",
                dashboardService.getAdminDashboard(),
                HttpStatus.OK
        ), HttpStatus.OK
        );
    }


    @GetMapping("/receptionist")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ReceptionistDashboardResponse>> getReceptionistDashboard() {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "Receptionist dashboard data retrieved successfully",
                dashboardService.getReceptionistDashboard(),
                HttpStatus.OK
        ), HttpStatus.OK
        );
    }

    @GetMapping("/maintenance")
    @PreAuthorize("hasAnyRole('MAINTENANCE', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<MaintenanceDashboardResponse>> getMaintenanceDashboard() {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "Maintenance dashboard data retrieved successfully",
                dashboardService.getMaintenanceDashboard(),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @GetMapping("/housekeeper")
    @PreAuthorize("hasAnyRole('HOUSEKEEPER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<HouseKeepingDashboardResponse>> getHousekeeperDashboard(
            @AuthenticationPrincipal String email) {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "Housekeeper dashboard data retrieved successfully",
                dashboardService.getHousekeeperDashboard(email),
                HttpStatus.OK
        ), HttpStatus.OK);
    }
}

