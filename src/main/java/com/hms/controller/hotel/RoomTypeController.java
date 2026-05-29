package com.hms.controller.hotel;

import java.util.List;
import java.util.Locale;

import com.hms.dto.response.RoomTypeResponse;
import com.hms.dto.roomtype.RoomTypeRequest;
import jakarta.validation.Valid;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<ApiResponse<List<RoomTypeResponse>>> getAllRoomType() {
        Locale locale = LocaleContextHolder.getLocale();
        List<RoomTypeResponse> list = roomTypeService.getAllRoomType();
        String message = messageSource.getMessage("success.roomtype.getall", null, locale);
        ApiResponse<List<RoomTypeResponse>> response = ApiResponse.<List<RoomTypeResponse>>builder()
                .success(true)
                .message(message)
                .data(list)
                .status(HttpStatus.OK)
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}")
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
    public ResponseEntity<ApiResponse<RoomTypeResponse>> createRoomType(@RequestBody @Valid RoomTypeRequest roomTypeRequest) {
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
    public ResponseEntity<ApiResponse<RoomTypeResponse>> updateRoomType(@PathVariable Long id, @RequestBody @Valid RoomTypeRequest roomTypeRequest) {
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

