package com.hms.service.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.request.BookingRoomAssignRequest;
import com.hms.dto.booking.request.BookingStatusRequest;
import com.hms.dto.booking.response.BookingResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface BookingService {

    Page<BookingResponse> getAllBookings(Integer page, Integer size, SortField sortBy, SortDirection direction);

    BookingResponse getBookingById(Long id);

    BookingResponse createBooking(BookingRequest request);

    BookingResponse updateBooking(Long id, BookingRequest request);

    void deleteBooking(Long id);

    Page<BookingResponse> searchBookings(BookingStatus status, Long customerId, Long roomTypeId, Long roomId, Integer page, Integer size);

    Page<BookingResponse> getMyBookingHistory(String email, Integer page, Integer size);

    Page<BookingResponse> getBookingsByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size);

    Page<BookingResponse> getBookingsByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size);

    BookingResponse updateBookingStatus(Long id, BookingStatusRequest request);

    BookingResponse assignRoom(Long bookingId, BookingRoomAssignRequest request);

    /** [FIX-04] Trả về số phòng còn trống của roomType trong khoảng thời gian */
    long checkAvailability(Long roomTypeId, LocalDateTime checkInDate, LocalDateTime checkOutDate);
}
