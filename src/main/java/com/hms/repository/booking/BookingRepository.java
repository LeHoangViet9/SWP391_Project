package com.hms.repository.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.entity.booking.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking,Long> {
    Page<Booking> findByBookingStatus(BookingStatus bookingStatus, Pageable pageable);

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    Page<Booking> findByRoomTypeId(Long roomType, Pageable pageable);

    Page<Booking> findByRoomId(Long roomId, Pageable pageable);

    Page<Booking> findByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Booking> findByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Boolean existsByRoomIdAndCheckInDateLessThanAndCheckOutDateGreaterThan(Long roomId, LocalDateTime newCheckOutDate, LocalDateTime newCheckInDate);


    // 1. Đếm số ca dự kiến CHECK-IN trong một khoảng thời gian (Ví dụ: Hôm nay từ 00:00 đến 23:59)
    long countByBookingStatusAndCheckInDateBetween(BookingStatus status,LocalDateTime start, LocalDateTime end);

    // 2. Đếm số ca dự kiến CHECK-OUT trong một khoảng thời gian (Ví dụ: Hôm nay)
    long countByBookingStatusAndCheckOutDateBetween(BookingStatus status,LocalDateTime start, LocalDateTime end);

    // 3. Đếm số lượng đơn đặt phòng mới đang ở trạng thái treo chờ duyệt (Ví dụ: "PENDING")
    long countByBookingStatusAndCreatedAtBetween(BookingStatus status, LocalDateTime start, LocalDateTime end);

    // 4. Thống kê số lượng đơn đặt phòng theo từng Tên Loại Phòng để vẽ biểu đồ cơ cấu doanh số (Pie Chart)
    // Câu lệnh JPQL này tự động kết nối sang bảng RoomType để lấy typeName
    @Query("SELECT b.roomType.typeName, COUNT(b) FROM Booking b GROUP BY b.roomType.typeName")
    List<Object[]> countBookingsGroupedByRoomType();
}
