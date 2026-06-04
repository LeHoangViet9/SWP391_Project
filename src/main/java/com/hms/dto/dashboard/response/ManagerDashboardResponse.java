package com.hms.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ManagerDashboardResponse {
    private double occupancyRate;       // Tỷ lệ lấp đầy phòng hôm nay (%)
    private long totalActiveGuests;     // Tổng số lượng khách hiện đang lưu trú tại khách sạn
    private long pendingHousekeepingTasks; // Số tác vụ dọn phòng chưa hoàn thành
    private long openDamageReports;     // Số báo cáo hỏng hóc thiết bị chưa được xử lý (từ bảng DAMAGE_REPORT)
    private Map<String, Long> roomStatusOverview;// Tổng quan Trống/Bẩn/Bảo trì để điều phối chung
}
