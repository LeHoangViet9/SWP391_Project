package com.hms.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionistDashboardResponse {
    // --- KHỐI 1: SỐ LIỆU DỰ KIẾN (EXPECTED) ---
    private long expectedCheckIns;  // Số ca dự kiến check-in hôm nay (đơn CONFIRMED)
    private long expectedCheckOuts; // Số ca dự kiến check-out hôm nay (đơn CHECKED_IN)

    // --- KHỐI 2: SỐ LIỆU THỰC TẾ TRONG NGÀY (ACTUAL) ---
    private long actualCheckIns;    // Số khách thực tế lễ tân đã làm thủ tục vào phòng thành công
    private long actualCheckOuts;   // Số khách thực tế lễ tân đã làm thủ tục trả phòng xong xuôi

    // --- KHỐI 3: CẢNH BÁO CẦN XỬ LÝ GẤP ---
    private long pendingBookings;   // Số đơn đặt phòng mới đang treo (PENDING) chờ duyệt gấp

    // --- KHỐI 4: TỔNG QUAN TRẠNG THÁI PHÒNG (Dùng vẽ biểu đồ tròn Pie Chart) ---
    // Ví dụ trả về: {"AVAILABLE": 12, "OCCUPIED": 25, "DIRTY": 4, "MAINTENANCE": 1}
    private Map<String, Long> roomStatusOverview;
}
