package com.hms.repository.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.entity.booking.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

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

        @Query("""
                            SELECT COUNT(b) > 0
                            FROM Booking b
                            WHERE b.room.id = :roomId
                            AND b.bookingStatus IN :statuses
                            AND b.checkInDate < :newCheckOutDate
                            AND b.checkOutDate > :newCheckInDate
                            AND (:excludedBookingId IS NULL OR b.id <> :excludedBookingId)
                        """)
        boolean existsConflict(
                        @Param("roomId") Long roomId,
                        @Param("newCheckOutDate") LocalDateTime newCheckOutDate,
                        @Param("newCheckInDate") LocalDateTime newCheckInDate,
                        @Param("excludedBookingId") Long excludedBookingId,
                        @Param("statuses") Collection<BookingStatus> statuses);

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

        List<Booking> findByBookingStatusAndCreatedAtBefore(
                        BookingStatus bookingStatus,
                        LocalDateTime dateTime);

        /**
         * Check if a room is already booked in the given date range (excluding the
         * current booking). Used for double-check after acquiring pessimistic lock
         * during check-in.
         */
        @Query("""
                            SELECT COUNT(b) > 0 FROM Booking b
                            WHERE b.room.id = :roomId
                            AND b.id <> :excludedBookingId
                            AND b.bookingStatus IN :statuses
                            AND b.checkInDate < :checkOutDate
                            AND b.checkOutDate > :checkInDate
                        """)
        boolean existsOverlappingBooking(
                        @Param("roomId") Long roomId,
                        @Param("excludedBookingId") Long excludedBookingId,
                        @Param("statuses") Collection<BookingStatus> statuses,
                        @Param("checkInDate") LocalDateTime checkInDate,
                        @Param("checkOutDate") LocalDateTime checkOutDate);
}
