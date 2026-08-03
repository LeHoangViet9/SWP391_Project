package com.hms.controller.hotel;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import com.hms.service.hotel.IRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final IRoomService roomService;
    private final MessageSource messageSource;

    @GetMapping
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
    public ApiResponse<Page<RoomResponse>> getAllRooms(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.getall", null, locale),
                roomService.getAllRooms(keyword, page, size, sortBy, direction)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
    public ApiResponse<RoomResponse> getRoomById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.getbyid", null, locale),
                roomService.getRoomById(id)
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROOM_CREATE')")
    public ApiResponse<RoomResponse> createRoom(
            @RequestBody @Valid RoomRequest roomRequest
    ) {
        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.create", null, locale),
                roomService.createRoom(roomRequest)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOM_UPDATE')")
    public ApiResponse<RoomResponse> updateRoom(
            @PathVariable Long id,
            @RequestBody @Valid RoomRequest roomRequest) {
        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.update", null, locale),
                roomService.updateRoom(id, roomRequest)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOM_DELETE')")
    public ApiResponse<Void> deleteRoom(
            @PathVariable Long id
    ) {
        Locale locale = LocaleContextHolder.getLocale();

        roomService.deleteRoomByID(id);

        return ApiResponse.success(
                messageSource.getMessage("success.room.delete", null, locale)
        );
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
    public ApiResponse<Page<RoomResponse>> getRoomsByStatus(
            @PathVariable RoomStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.getbystatus", null, locale),
                roomService.getRoomsByStatus(status, page, size)
        );
    }

    @GetMapping("/floor/{floorNumber}")
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
    public ApiResponse<Page<RoomResponse>> getRoomsByFloor(
            @PathVariable Integer floorNumber,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.getbyfloor", null, locale),
                roomService.getRoomsByFloor(floorNumber, page, size)
        );
    }

    @GetMapping("/room-type/{roomTypeId}")
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
    public ApiResponse<Page<RoomResponse>> getRoomsByRoomType(
            @PathVariable Long roomTypeId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.getbyroomtype", null, locale),
                roomService.getRoomsByRoomType(roomTypeId, page, size)
        );
    }

    @GetMapping("/available")
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
    public ApiResponse<Page<RoomResponse>> getAvailableRooms(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("success.room.getavailable", null, locale),
                roomService.getAvailableRooms(page, size)
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROOM_UPDATE')")
    public ApiResponse<Void> updateRoomStatus(
            @PathVariable Long id,
            @RequestParam RoomStatus status) {

        Locale locale = LocaleContextHolder.getLocale();

        roomService.updateRoomStatus(id, status);

        return ApiResponse.success(
                messageSource.getMessage("success.room.updatestatus", null, locale)
        );
    }
}

