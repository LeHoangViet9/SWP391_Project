package com.hms.controller.dashboard;


import com.hms.common.dto.ApiResponse;
import com.hms.dto.dashboard.response.AdminDashboardResponse;
import com.hms.dto.dashboard.response.ReceptionistDashboardResponse;
import com.hms.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/dashboards")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;
    @GetMapping("/admin")
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
    public ResponseEntity<ApiResponse<ReceptionistDashboardResponse>> getReceptionistDashboard() {
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "Receptionist dashboard data retrieved successfully",
                dashboardService.getReceptionistDashboard(),
                HttpStatus.OK
        ), HttpStatus.OK
        );
    }
}

