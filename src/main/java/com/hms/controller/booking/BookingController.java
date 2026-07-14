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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.List;
import com.hms.dto.checkin.response.AvailableRoomResponseDTO;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor

public class BookingController {

        private final BookingService bookingService;
        private final MessageSource messageSource;

        @GetMapping
        @PreAuthorize("hasAuthority('BOOKING_VIEW')")
        public ResponseEntity<ApiResponse<Page<BookingResponse>>> getAllBooking(
                        @RequestParam(required = false) Integer size,
                        @RequestParam(required = false) Integer page,
                        @RequestParam(defaultValue = "ID") SortField sortBy,
                        @RequestParam(defaultValue = "ASC") SortDirection direction) {

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
        @PreAuthorize("hasAuthority('BOOKING_VIEW') or hasAuthority('CHECKIN_VIEW')")
        public ResponseEntity<ApiResponse<Page<BookingResponse>>> searchBookings(
                        @RequestParam(required = false) BookingStatus status,
                        @RequestParam(required = false) Long customerId,
                        @RequestParam(required = false) Long roomTypeId,
                        @RequestParam(required = false) Long roomId,
                        @RequestParam(required = false) Integer page,
                        @RequestParam(required = false) Integer size) {

                Locale locale = LocaleContextHolder.getLocale();

                Page<BookingResponse> data = bookingService.searchBookings(status, customerId, roomTypeId, roomId, page,
                                size);

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
        @PreAuthorize("hasAuthority('BOOKING_VIEW_OWN') or hasAuthority('BOOKING_VIEW')")
        public ResponseEntity<ApiResponse<Page<BookingResponse>>> getMyBookingHistory(
                        @AuthenticationPrincipal String email,
                        @RequestParam(required = false) Integer page,
                        @RequestParam(required = false) Integer size) {

                Locale locale = LocaleContextHolder.getLocale();

                Page<BookingResponse> data = bookingService.getMyBookingHistory(email, page, size);

                ApiResponse<Page<BookingResponse>> response = ApiResponse.<Page<BookingResponse>>builder()
                                .success(true)
                                .message(messageSource.getMessage("success.booking.history", null,
                                                "Booking history retrieved successfully", locale))
                                .data(data)
                                .status(HttpStatus.OK)
                                .build();

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{id}")
        @PreAuthorize("hasAuthority('BOOKING_VIEW')")
        public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id) {
                Locale locale = LocaleContextHolder.getLocale();

                BookingResponse data = bookingService.getBookingById(id);

                String message = messageSource.getMessage("success.booking.getbyid", null, locale);

                ApiResponse<BookingResponse> response = ApiResponse.<BookingResponse>builder()
                                .success(true)
                                .message(message)
                                .data(data)
                                .status(HttpStatus.OK)
                                .build();

                return ResponseEntity.ok(response);
        }

        @GetMapping("/check-in")
        @PreAuthorize("hasAuthority('BOOKING_VIEW')")
        public ResponseEntity<ApiResponse<Page<BookingResponse>>> getBookingByCheckInDateBetween(
                        @RequestParam LocalDateTime start,
                        @RequestParam LocalDateTime end,
                        @RequestParam Integer page,
                        @RequestParam Integer size) {

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
        @PreAuthorize("hasAuthority('BOOKING_VIEW')")
        public ResponseEntity<ApiResponse<Page<BookingResponse>>> getBookingByCheckOutDateBetween(
                        @RequestParam LocalDateTime start,
                        @RequestParam LocalDateTime end,
                        @RequestParam Integer page,
                        @RequestParam Integer size) {

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
        @PreAuthorize("hasAuthority('BOOKING_CREATE')")
        public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
                        @Valid @RequestBody BookingRequest request) {

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
        @PreAuthorize("hasAuthority('BOOKING_UPDATE')")
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
        @PreAuthorize("hasAuthority('BOOKING_DELETE') or @invoiceAccessService.canAccessBooking(#id, authentication)")
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
        @PreAuthorize("hasAuthority('BOOKING_UPDATE')")
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
        @PreAuthorize("hasAuthority('BOOKING_UPDATE')")
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

        @GetMapping("/check-availability")
        @PreAuthorize("permitAll()")
        public ResponseEntity<ApiResponse<Long>> checkAvailability(
                        @RequestParam Long roomTypeId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkInDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkOutDate) {

                long availableRooms = bookingService.checkAvailability(roomTypeId, checkInDate, checkOutDate);
                return ResponseEntity.ok(ApiResponse.<Long>builder()
                                .success(true)
                                .message("success.booking.check.availability")
                                .data(availableRooms)
                                .status(HttpStatus.OK)
                                .build());
        }

        @GetMapping("/available-rooms")
        @PreAuthorize("permitAll()")
        public ResponseEntity<ApiResponse<List<AvailableRoomResponseDTO>>> getAvailableRooms(
                        @RequestParam Long roomTypeId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkInDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkOutDate) {
                return ResponseEntity.ok(ApiResponse.<List<AvailableRoomResponseDTO>>builder()
                                .success(true)
                                .message("Available rooms retrieved successfully")
                                .data(bookingService.getAvailableRooms(roomTypeId, checkInDate, checkOutDate))
                                .status(HttpStatus.OK)
                                .build());
        }
}
