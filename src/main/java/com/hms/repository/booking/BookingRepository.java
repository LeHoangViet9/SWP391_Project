package com.hms.repository.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.entity.booking.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface BookingRepository extends JpaRepository<Booking,Long> {

    Page<Booking> findByBookingStatus(BookingStatus bookingStatus, Pageable pageable);

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    Page<Booking> findByRoomTypeId(Long roomType, Pageable pageable);

    Page<Booking> findByRoomId(Long roomId, Pageable pageable);

    Page<Booking> findByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Booking> findByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Boolean existsByRoomIdAndCheckInDateLessThanAndCheckOutDateGreaterThan(Long roomId, LocalDateTime newCheckOutDate, LocalDateTime newCheckInDate);
}
