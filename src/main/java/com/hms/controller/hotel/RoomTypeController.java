package com.hms.controller.hotel;

import java.util.Locale;

import com.hms.dto.roomtype.response.RoomTypeResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import com.hms.dto.roomtype.request.RoomTypeRequest;
import jakarta.validation.Valid;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hms.common.enums.SortField;
import com.hms.common.enums.SortDirection;
import com.hms.common.dto.ApiResponse;
import com.hms.service.hotel.IRoomTypeService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/room-types")
@RequiredArgsConstructor
public class RoomTypeController {

    private final IRoomTypeService roomTypeService;

    private final MessageSource messageSource;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<Page<RoomTypeResponse>>> getAllRoomType(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("success.roomtype.getall", null, locale);

        ApiResponse<Page<RoomTypeResponse>> response = ApiResponse.<Page<RoomTypeResponse>>builder()
                .success(true)
                .message(message)
                .data(roomTypeService.getAllRoomType(
                       keyword,
                        page,
                        size,
                        sortBy,
                        direction))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> getRoomTypeById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomTypeResponse roomTypeResponse = roomTypeService.getRoomTypeById(id);
        String message = messageSource.getMessage("success.roomtype.getbyid", null, locale);
        ApiResponse<RoomTypeResponse> response = ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message(message)
                .data(roomTypeResponse)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROOM_TYPE_CREATE')")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> createRoomType(@ModelAttribute @Valid RoomTypeRequest roomTypeRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomTypeResponse created = roomTypeService.createRoomType(roomTypeRequest);
        String message = messageSource.getMessage("success.roomtype.create", null, locale);
        ApiResponse<RoomTypeResponse> response = ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message(message)
                .data(created)
                .status(HttpStatus.CREATED)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOM_TYPE_UPDATE')")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> updateRoomType(@PathVariable Long id, @ModelAttribute @Valid RoomTypeRequest roomTypeRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomTypeResponse updated = roomTypeService.updateRoomType(id, roomTypeRequest);
        String message = messageSource.getMessage("success.roomtype.update", null, locale);
        ApiResponse<RoomTypeResponse> response = ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message(message)
                .data(updated)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOM_TYPE_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteRoomType(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        roomTypeService.deleteRoomTypeByID(id);
        String message = messageSource.getMessage("success.roomtype.delete", null, locale);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

