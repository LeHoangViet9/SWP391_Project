package com.hms.dto.dashboard.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {
    private BigDecimal totalRevenueAllTime; // Tổng doanh thu lịch sử từ trước đến nay
    private BigDecimal todayRevenue;        // Doanh thu riêng ngày hôm nay
    private BigDecimal thisMonthRevenue;    // Doanh thu gom của tháng này
    private long totalSuccessfulBookings;   // Tổng số đơn đặt phòng thành công mang lại tiền

    // --- KHỐI 2: DỮ LIỆU VẼ BIỂU ĐỒ TRÒN (CƠ CẤU) ---
    // Cơ cấu doanh số theo loại phòng (Hạng phòng nào được chuộng nhất)
    // Trả về map dạng: {"Deluxe Room": 45, "Suite Room": 20, "Standard Room": 80}
    private Map<String, Long> bookingsCountByRoomType;

    // Cơ cấu nguồn thu theo phương thức thanh toán (Khách thích trả bằng gì)
    // Trả về map dạng: {"VNPAY": 52000000, "CASH": 15000000, "CARD": 30000000}
    private Map<String, BigDecimal> revenueByPaymentMethod;

    // --- KHỐI 3: DỮ LIỆU VẼ BIỂU ĐỒ ĐƯỜNG / CỘT (XU HƯỚNG TĂNG TRƯỞNG) ---
    // Danh sách doanh thu theo từng mốc thời gian (ví dụ: 7 ngày gần nhất hoặc 12 tháng trong năm)
    private List<RevenueChartPoint> revenueTrend;

    // Class con bổ trợ để định dạng điểm mốc trên biểu đồ Front-end (ví dụ trục X và trục Y)
    @Data
    @AllArgsConstructor
    public static class RevenueChartPoint {
        private String label;        // Ví dụ: "Thứ 2", "Thứ 3"... hoặc "Tháng 5", "Tháng 6"
        private BigDecimal value;    // Số tiền doanh thu tương ứng mốc đó
    }
}
