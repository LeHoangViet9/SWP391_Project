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

@RestController
@RequestMapping("/api/v1/housekeeping")
@RequiredArgsConstructor
public class HousekeepingController {

    private final IRoomService roomService;
    private final MessageSource messageSource;

    @GetMapping("/dirty-rooms")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getDirtyRooms(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        Page<RoomResponse> data = roomService.getRoomsByStatus(RoomStatus.DIRTY, page, size);

        return ResponseEntity.ok(ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(messageSource.getMessage("success.housekeeping.dirty.rooms", null, "Fetched dirty rooms successfully.", locale))
                .data(data)
                .status(HttpStatus.OK)
                .build());
    }

    @GetMapping("/cleaning-rooms")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_VIEW')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getCleaningRooms(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        Page<RoomResponse> data = roomService.getRoomsByStatus(RoomStatus.CLEANING, page, size);

        return ResponseEntity.ok(ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(messageSource.getMessage("success.housekeeping.cleaning.rooms", null, "Fetched cleaning rooms successfully.", locale))
                .data(data)
                .status(HttpStatus.OK)
                .build());
    }

    @PatchMapping("/rooms/{id}/status")
    @PreAuthorize("hasAuthority('HOUSEKEEPING_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> updateRoomCleaningStatus(
            @PathVariable Long id,
            @RequestParam RoomStatus status) {

        Locale locale = LocaleContextHolder.getLocale();

        if (status != RoomStatus.CLEANING && status != RoomStatus.READY && status != RoomStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                    .success(false)
                    .message(messageSource.getMessage("error.housekeeping.invalid.status", null, "Invalid housekeeping status transition.", locale))
                    .status(HttpStatus.BAD_REQUEST)
                    .build());
        }

        roomService.updateRoomStatus(id, status);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message(messageSource.getMessage("success.housekeeping.status.updated", null, "Housekeeping status updated successfully.", locale))
                .status(HttpStatus.OK)
                .build());
    }
}