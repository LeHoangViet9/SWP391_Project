package com.hms.repository.booking;

import com.hms.entity.booking.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking,Long> {
    List<Booking> findByCustomerId(Long customerId);

    List<Booking> findByBookingStatus(String status);

    List<Booking> findByCustomerIdAndBookingStatus(Long customerId, String status);

    // 1. Đếm số ca dự kiến CHECK-IN trong một khoảng thời gian (Ví dụ: Hôm nay từ 00:00 đến 23:59)
    long countByCheckInDateBetween(LocalDateTime start, LocalDateTime end);

    // 2. Đếm số ca dự kiến CHECK-OUT trong một khoảng thời gian (Ví dụ: Hôm nay)
    long countByCheckOutDateBetween(LocalDateTime start, LocalDateTime end);

    // 3. Đếm số lượng đơn đặt phòng mới đang ở trạng thái treo chờ duyệt (Ví dụ: "PENDING")
    long countByBookingStatusAndCreatedAtBetween(String status, LocalDateTime start, LocalDateTime end);

    // 4. Thống kê số lượng đơn đặt phòng theo từng Tên Loại Phòng để vẽ biểu đồ cơ cấu doanh số (Pie Chart)
    // Câu lệnh JPQL này tự động kết nối sang bảng RoomType để lấy typeName
    @Query("SELECT b.roomType.typeName, COUNT(b) FROM Booking b GROUP BY b.roomType.typeName")
    List<Object[]> countBookingsGroupedByRoomType();
}
