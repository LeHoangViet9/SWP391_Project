package com.hms.service.dashboard;

import com.hms.dto.dashboard.response.AdminDashboardResponse;
import com.hms.dto.dashboard.response.MaintenanceDashboardResponse;
import com.hms.dto.dashboard.response.ManagerDashboardResponse;
import com.hms.dto.dashboard.response.ReceptionistDashboardResponse;

public interface DashboardService {
    AdminDashboardResponse getAdminDashboard();
    ReceptionistDashboardResponse getReceptionistDashboard();
    MaintenanceDashboardResponse getMaintenanceDashboard();


}
