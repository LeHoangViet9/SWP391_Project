package com.hms.controller.hotel;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.RoomStatus;
import com.hms.dto.room.response.RoomResponse;
import com.hms.service.hotel.IRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Locale;

/**
 * API phục vụ nhân viên buồng phòng (Housekeeper):
 *  - Xem danh sách phòng cần dọn (DIRTY)
 *  - Cập nhật trạng thái phòng: DIRTY → CLEANING → READY
 */
@RestController
@RequestMapping("/api/v1/housekeeping")
@RequiredArgsConstructor
public class HousekeepingController {

    private final IRoomService roomService;
    private final MessageSource messageSource;

    /**
     * GET /api/v1/housekeeping/dirty-rooms
     * Lấy danh sách phòng DIRTY (cần dọn dẹp).
     */
    @GetMapping("/dirty-rooms")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getDirtyRooms(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        Page<RoomResponse> data = roomService.getRoomsByStatus(RoomStatus.DIRTY, page, size);

        return ResponseEntity.ok(ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(messageSource.getMessage("success.housekeeping.dirty.rooms", null, locale))
                .data(data)
                .status(HttpStatus.OK)
                .build());
    }

    /**
     * GET /api/v1/housekeeping/cleaning-rooms
     * Lấy danh sách phòng đang được dọn (CLEANING).
     */
    @GetMapping("/cleaning-rooms")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getCleaningRooms(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        Page<RoomResponse> data = roomService.getRoomsByStatus(RoomStatus.CLEANING, page, size);

        return ResponseEntity.ok(ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(messageSource.getMessage("success.housekeeping.cleaning.rooms", null, locale))
                .data(data)
                .status(HttpStatus.OK)
                .build());
    }

    /**
     * PATCH /api/v1/housekeeping/rooms/{id}/status?status=CLEANING|READY
     * Housekeeper cập nhật trạng thái phòng trong luồng dọn phòng.
     * Chỉ cho phép các chuyển đổi: DIRTY → CLEANING và CLEANING → READY.
     */
    @PatchMapping("/rooms/{id}/status")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> updateRoomCleaningStatus(
            @PathVariable Long id,
            @RequestParam RoomStatus status) {

        Locale locale = LocaleContextHolder.getLocale();

        // Validate chỉ cho phép housekeeping transitions
        if (status != RoomStatus.CLEANING && status != RoomStatus.READY && status != RoomStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                    .success(false)
                    .message(messageSource.getMessage("error.housekeeping.invalid.status", null, locale))
                    .status(HttpStatus.BAD_REQUEST)
                    .build());
        }

        roomService.updateRoomStatus(id, status);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message(messageSource.getMessage("success.housekeeping.status.updated", null, locale))
                .status(HttpStatus.OK)
                .build());
    }
}
