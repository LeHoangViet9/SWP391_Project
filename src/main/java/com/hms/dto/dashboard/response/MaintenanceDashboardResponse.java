package com.hms.dto.dashboard.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MaintenanceDashboardResponse {
    private Long totalRequests;       // Tổng số phiếu sửa chữa từ trước đến nay
    private Long pendingRequests;     // Số phiếu đang chờ xử lý
    private Long inProgressRequests;  // Số phiếu đang tiến hành sửa
    private Long completedRequests;   // Số phiếu đã sửa xong

    private BigDecimal totalCost;     // Tổng chi phí đã chi trả cho bảo trì

    // Thống kê số lượng phiếu theo mức độ nghiêm trọng (LOW, MEDIUM, HIGH, CRITICAL)
    private Map<String, Long> requestsBySeverity;
}
