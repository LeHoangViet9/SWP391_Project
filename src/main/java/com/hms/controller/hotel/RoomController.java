package com.hms.controller.hotel;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.utils.CloudinaryUtils;
import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import com.hms.service.hotel.IRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final IRoomService roomService;
    private final MessageSource messageSource;
    private final CloudinaryUtils cloudinaryUtils;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getAllRooms(
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.room.getall", null, locale);

        ApiResponse<Page<RoomResponse>> response = ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(message)
                .data(roomService.getAllRooms(keywords, page, size, sortBy, direction))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING')")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomResponse roomResponse = roomService.getRoomById(id);
        String message = messageSource.getMessage("success.room.getbyid", null, locale);

        ApiResponse<RoomResponse> response = ApiResponse.<RoomResponse>builder()
                .success(true)
                .message(message)
                .data(roomResponse)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(@RequestParam("file")MultipartFile file, @ModelAttribute @Valid RoomRequest roomRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomResponse created = roomService.createRoom(roomRequest,file);
        String message = messageSource.getMessage("success.room.create", null, locale);

        ApiResponse<RoomResponse> response = ApiResponse.<RoomResponse>builder()
                .success(true)
                .message(message)
                .data(created)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @RequestParam("file") MultipartFile file,
            @PathVariable Long id,
            @RequestBody @Valid RoomRequest roomRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomResponse updated = roomService.updateRoom(id, roomRequest,file);
        String message = messageSource.getMessage("success.room.update", null, locale);

        ApiResponse<RoomResponse> response = ApiResponse.<RoomResponse>builder()
                .success(true)
                .message(message)
                .data(updated)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        roomService.deleteRoomByID(id);
        String message = messageSource.getMessage("success.room.delete", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByStatus(
            @PathVariable RoomStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.room.getbystatus", null, locale);

        ApiResponse<Page<RoomResponse>> response = ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(message)
                .data(roomService.getRoomsByStatus(status, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/floor/{floorNumber}")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByFloor(
            @PathVariable Integer floorNumber,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.room.getbyfloor", null, locale);

        ApiResponse<Page<RoomResponse>> response = ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(message)
                .data(roomService.getRoomsByFloor(floorNumber, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/room-type/{roomTypeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByRoomType(
            @PathVariable Long roomTypeId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.room.getbyroomtype", null, locale);

        ApiResponse<Page<RoomResponse>> response = ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(message)
                .data(roomService.getRoomsByRoomType(roomTypeId, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getAvailableRooms(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.room.getavailable", null, locale);

        ApiResponse<Page<RoomResponse>> response = ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(message)
                .data(roomService.getAvailableRooms(page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING')")
    public ResponseEntity<ApiResponse<Void>> updateRoomStatus(
            @PathVariable Long id,
            @RequestParam RoomStatus status) {

        Locale locale = LocaleContextHolder.getLocale();
        roomService.updateRoomStatus(id, status);
        String message = messageSource.getMessage("success.room.updatestatus", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

