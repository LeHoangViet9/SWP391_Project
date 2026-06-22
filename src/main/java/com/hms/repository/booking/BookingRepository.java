package com.hms.repository.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.entity.booking.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
<<<<<<< HEAD
=======
import org.springframework.stereotype.Repository;
>>>>>>> CheckIn

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

<<<<<<< HEAD
public interface BookingRepository extends JpaRepository<Booking, Long> {

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
                        Pageable pageable);

        @Query("""
                            SELECT b
                            FROM Booking b
                            WHERE b.customer.id = :customerId
                        """)
        Page<Booking> findHistoryByCustomerId(
                        @Param("customerId") Long customerId,
                        Pageable pageable);

        Page<Booking> findByCheckInDateBetween(
                        LocalDateTime start,
                        LocalDateTime end,
                        Pageable pageable);

        Page<Booking> findByCheckOutDateBetween(
                        LocalDateTime start,
                        LocalDateTime end,
                        Pageable pageable);

        boolean existsByRoomIdAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                        Long roomId,
                        LocalDateTime newCheckOutDate,
                        LocalDateTime newCheckInDate);

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
                        @Param("statuses") Collection<BookingStatus> statuses);

        long countByBookingStatusAndCheckInDateBetween(
                        BookingStatus status,
                        LocalDateTime start,
                        LocalDateTime end);

        long countByBookingStatusAndCheckOutDateBetween(
                        BookingStatus status,
                        LocalDateTime start,
                        LocalDateTime end);

        long countByBookingStatusAndCreatedAtBetween(
                        BookingStatus status,
                        LocalDateTime start,
                        LocalDateTime end);

        @Query("""
                            SELECT b.roomType.typeName, COUNT(b)
                            FROM Booking b
                            GROUP BY b.roomType.typeName
                        """)
        List<Object[]> countBookingsGroupedByRoomType();

        long countBookingByBookingStatus(BookingStatus bookingStatus);

        boolean existsByRoomTypeId(Long roomTypeId);
}
=======
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Page<Booking> findByBookingStatus(BookingStatus bookingStatus, Pageable pageable);

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    Page<Booking> findByRoomTypeId(Long roomType, Pageable pageable);

    Page<Booking> findByRoomId(Long roomId, Pageable pageable);

    Page<Booking> findByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Booking> findByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Boolean existsByRoomIdAndCheckInDateLessThanAndCheckOutDateGreaterThan(Long roomId, LocalDateTime newCheckOutDate,
            LocalDateTime newCheckInDate);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Booking b " +
           "WHERE b.room.id = :roomId AND b.id != :bookingId " +
           "AND b.bookingStatus IN :statuses " +
           "AND b.checkInDate < :checkOutDate AND b.checkOutDate > :checkInDate")
    boolean existsOverlappingBooking(
            @Param("roomId") Long roomId,
            @Param("bookingId") Long bookingId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("checkInDate") LocalDateTime checkInDate,
            @Param("checkOutDate") LocalDateTime checkOutDate
    );

    // 1. Đếm số ca dự kiến CHECK-IN trong một khoảng thời gian (Ví dụ: Hôm nay từ
    // 00:00 đến 23:59)
    long countByBookingStatusAndCheckInDateBetween(BookingStatus status, LocalDateTime start, LocalDateTime end);

    // 2. Đếm số ca dự kiến CHECK-OUT trong một khoảng thời gian (Ví dụ: Hôm nay)
    long countByBookingStatusAndCheckOutDateBetween(BookingStatus status, LocalDateTime start, LocalDateTime end);

    // 3. Đếm số lượng đơn đặt phòng mới đang ở trạng thái treo chờ duyệt (Ví dụ:
    // "PENDING")
    long countByBookingStatusAndCreatedAtBetween(BookingStatus status, LocalDateTime start, LocalDateTime end);

    // 4. Thống kê số lượng đơn đặt phòng theo từng Tên Loại Phòng để vẽ biểu đồ cơ
    // cấu doanh số (Pie Chart)
    // Câu lệnh JPQL này tự động kết nối sang bảng RoomType để lấy typeName
    @Query("SELECT b.roomType.typeName, COUNT(b) FROM Booking b GROUP BY b.roomType.typeName")
    List<Object[]> countBookingsGroupedByRoomType();

    long countBookingByBookingStatus(BookingStatus bookingStatus);
}
>>>>>>> CheckIn
