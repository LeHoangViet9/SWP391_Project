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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final IRoomService roomService;
    private final MessageSource messageSource;

    @GetMapping
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getAllRooms(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.room.getall", null, locale);

        ApiResponse<Page<RoomResponse>> response = ApiResponse.<Page<RoomResponse>>builder()
                .success(true)
                .message(message)
                .data(roomService.getAllRooms(keyword, page, size, sortBy, direction))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
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
    @PreAuthorize("hasAuthority('ROOM_CREATE')")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @RequestParam(value = "imageRoom", required = false) List<MultipartFile> file,
            @ModelAttribute @Valid RoomRequest roomRequest) {
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
    @PreAuthorize("hasAuthority('ROOM_UPDATE')")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @RequestParam(value = "imageRoom", required = false) List<MultipartFile> file,
            @PathVariable Long id,
            @ModelAttribute @Valid RoomRequest roomRequest) {
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
    @PreAuthorize("hasAuthority('ROOM_DELETE')")
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
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
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
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
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
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
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
    @PreAuthorize("hasAuthority('ROOM_VIEW')")
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
    @PreAuthorize("hasAuthority('ROOM_UPDATE')")
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

