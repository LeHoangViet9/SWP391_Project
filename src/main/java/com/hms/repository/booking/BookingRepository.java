package com.hms.repository.booking;


import com.hms.common.enums.BookingStatus;
import com.hms.entity.booking.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;


@Repository
public interface BookingRepository extends JpaRepository<Booking,Long> {

    @Query("""
    SELECT b
    FROM Booking b
    WHERE (:status IS NULL OR b.bookingStatus = :status)
    AND (:customerId IS NULL OR b.customer.id = :customerId)
    AND (:roomTypeId IS NULL OR b.roomType.id = :roomTypeId)
    AND (:roomId IS NULL OR b.room.id = :roomId)
    """)
    Page<Booking> searchBookings(
            @Param("status") BookingStatus status,
            @Param("customerId") Long customerId,
            @Param("roomTypeId") Long roomTypeId,
            @Param("roomId") Long roomId,
            Pageable pageable
    );

    Page<Booking> findByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Booking> findByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    boolean existsByRoomIdAndCheckInDateLessThanAndCheckOutDateGreaterThan(Long roomId, LocalDateTime newCheckOutDate, LocalDateTime newCheckInDate);

    @Query("""
    SELECT COALESCE(SUM(b.quantity), 0)
    FROM Booking b
    WHERE b.roomType.id = :roomTypeId
    AND b.bookingStatus IN :statuses
    AND b.checkInDate < :checkOutDate
    AND b.checkOutDate > :checkInDate
    AND (:excludedBookingId IS NULL OR b.id <> :excludedBookingId)
    """)
    long sumBookedQuantityByRoomTypeAndDateRange(
            @Param("roomTypeId") Long roomTypeId,
            @Param("checkInDate") LocalDateTime checkInDate,
            @Param("checkOutDate") LocalDateTime checkOutDate,
            @Param("excludedBookingId") Long excludedBookingId,
            @Param("statuses") Collection<BookingStatus> statuses
    );




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


    long countBookingByBookingStatus(BookingStatus bookingStatus);
}

