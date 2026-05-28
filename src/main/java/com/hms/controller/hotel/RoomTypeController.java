package com.hms.controller.hotel;

import java.util.List;
import java.util.Locale;

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

import com.hms.dto.response.ApiResponse;
import com.hms.entity.hotel.RoomType;
import com.hms.service.hotel.IRoomTypeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/room-types")
@RequiredArgsConstructor
public class RoomTypeController {
    private final IRoomTypeService roomTypeService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomType>>> getAllRoomType() {
        Locale locale = LocaleContextHolder.getLocale();
        List<RoomType> list = roomTypeService.getAllRoomType();
        String message = messageSource.getMessage("success.roomtype.getall", null, locale);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(message, list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomType>> getRoomTypeById(@PathVariable int id) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomType roomType = roomTypeService.getRoomTypeById(id);
        String message = messageSource.getMessage("success.roomtype.getbyid", null, locale);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(message, roomType));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoomType>> createRoomType(@RequestBody RoomType roomType) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomType created = roomTypeService.createRoomType(roomType);
        String message = messageSource.getMessage("success.roomtype.create", null, locale);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message, created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomType>> updateRoomType(@PathVariable int id, @RequestBody RoomType roomType) {
        Locale locale = LocaleContextHolder.getLocale();
        RoomType updated = roomTypeService.updateRoomType(id, roomType);
        String message = messageSource.getMessage("success.roomtype.update", null, locale);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(message, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoomType(@PathVariable int id) {
        Locale locale = LocaleContextHolder.getLocale();
        roomTypeService.deleteRoomTypeByID(id);
        String message = messageSource.getMessage("success.roomtype.delete", null, locale);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(message));
    }
}

