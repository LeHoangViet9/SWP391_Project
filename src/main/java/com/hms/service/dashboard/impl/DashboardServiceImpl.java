package com.hms.service.dashboard.impl;

import com.hms.dto.dashboard.response.AdminDashboardResponse;
import com.hms.dto.dashboard.response.ReceptionistDashboardResponse;
import com.hms.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DashboardServiceImpl implements DashboardService {
    @Override
    public AdminDashboardResponse getAdminDashboard() {
        return null;
    }

    @Override
    public ReceptionistDashboardResponse getReceptionistDashboard() {
        return null;
    }
}
