package com.hms.controller.booking;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.request.BookingRoomAssignRequest;
import com.hms.dto.booking.request.BookingStatusRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.service.booking.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor

public class BookingController {

    private final BookingService bookingService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getAllBooking(
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "ID")SortField sortBy,
            @RequestParam(defaultValue = "ASC")SortDirection direction){

        Locale locale = LocaleContextHolder.getLocale();

        Page<BookingResponse> data = bookingService.getAllBookings(page, size, sortBy, direction);

        String message = messageSource.getMessage("success.booking.getall", null, locale);

        ApiResponse<Page<BookingResponse>> response = ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> searchBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long roomTypeId,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();

        Page<BookingResponse> data = bookingService.searchBookings(status, customerId, roomTypeId, roomId, page, size);

        String message = messageSource.getMessage("success.booking.getall", null, locale);

        ApiResponse<Page<BookingResponse>> response = ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getMyBookingHistory(
            @AuthenticationPrincipal String username,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();

        Page<BookingResponse> data = bookingService.getMyBookingHistory(username, page, size);

        ApiResponse<Page<BookingResponse>> response = ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message(messageSource.getMessage("success.booking.history", null, "Booking history retrieved successfully", locale))
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id){
        Locale locale = LocaleContextHolder.getLocale();

        BookingResponse data = bookingService.getBookingById(id);

        String message = messageSource.getMessage("success.booking.getbyid", null, locale);

        ApiResponse<BookingResponse> response = ApiResponse.<BookingResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return  ResponseEntity.ok(response);
    }

    @GetMapping("/check-in")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getBookingByCheckInDateBetween(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end,
            @RequestParam Integer page,
            @RequestParam Integer size){

        Locale locale = LocaleContextHolder.getLocale();

        Page<BookingResponse> data = bookingService.getBookingsByCheckInDateBetween(start, end, page, size);

        String message = messageSource.getMessage("success.booking.getall", null, locale);

        ApiResponse<Page<BookingResponse>> response = ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-out")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getBookingByCheckOutDateBetween(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end,
            @RequestParam Integer page,
            @RequestParam Integer size){

        Locale locale = LocaleContextHolder.getLocale();

        Page<BookingResponse> data = bookingService.getBookingsByCheckOutDateBetween(start, end, page, size);

        String message = messageSource.getMessage("success.booking.getall", null, locale);

        ApiResponse<Page<BookingResponse>> response = ApiResponse.<Page<BookingResponse>>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request){

        Locale locale = LocaleContextHolder.getLocale();

        BookingResponse data = bookingService.createBooking(request);

        String message = messageSource.getMessage("success.booking.create", null, locale);

        ApiResponse<BookingResponse> response = ApiResponse.<BookingResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingRequest request) {

        Locale locale = LocaleContextHolder.getLocale();

        BookingResponse data = bookingService.updateBooking(id, request);

        String message = messageSource.getMessage("success.booking.update", null, locale);

        ApiResponse<BookingResponse> response = ApiResponse.<BookingResponse>builder()
                        .success(true)
                        .message(message)
                        .data(data)
                        .status(HttpStatus.OK)
                        .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(
            @PathVariable Long id) {

        Locale locale = LocaleContextHolder.getLocale();

        bookingService.deleteBooking(id);

        String message = messageSource.getMessage("success.booking.delete", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                        .success(true)
                        .message(message)
                        .status(HttpStatus.OK)
                        .build();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusRequest request) {

        Locale locale = LocaleContextHolder.getLocale();
        BookingResponse data = bookingService.updateBookingStatus(id, request);
        String message = messageSource.getMessage("success.booking.status.updated", null, locale);

        ApiResponse<BookingResponse> response = ApiResponse.<BookingResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/assign-room")
    public ResponseEntity<ApiResponse<BookingResponse>> assignRoom(
            @PathVariable Long id,
            @Valid @RequestBody BookingRoomAssignRequest request) {

        Locale locale = LocaleContextHolder.getLocale();
        BookingResponse data = bookingService.assignRoom(id, request);
        String message = messageSource.getMessage("success.booking.room.assigned", null, locale);

        ApiResponse<BookingResponse> response = ApiResponse.<BookingResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.ok(response);
    }
}
