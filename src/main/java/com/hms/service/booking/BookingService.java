package com.hms.service.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.entity.booking.Booking;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface BookingService {

    Page<BookingResponse> getAllBooking(Integer page, Integer size, SortField sortBy, SortDirection direction);

    BookingResponse getBookingById(Long id);

    BookingResponse createBooking(BookingRequest request);

    BookingResponse updateBooking(Long id, BookingRequest request);

    void deleteBooking(Long id);

    Page<BookingResponse> getBookingByStatus(BookingStatus bookingStatus, Integer page, Integer size);

    Page<BookingResponse> getBookingByCustomer(Long customerId, Integer page, Integer size);

    Page<BookingResponse> getBookingsByRoomType(Long roomTypeId, Integer page, Integer size);

    Page<BookingResponse> getBookingsByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size);

    Page<BookingResponse> getBookingsByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size);
}
