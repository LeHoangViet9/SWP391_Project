package com.hms.controller.equipment;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.AssignEquipmentToRoomDTO;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.dto.equipment.response.RoomEquipmentResponse;
import com.hms.service.equipment.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final MessageSource messageSource;

    @GetMapping
    @PreAuthorize("hasAuthority('EQUIPMENT_VIEW')")
    public ResponseEntity<ApiResponse<Page<EquipmentResponse>>> getAllEquipments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();

        Page<EquipmentResponse> data = equipmentService.getAllEquipments(
               keyword,
                status,
                page,
                size,
                sortBy,
                direction
        );

        String message = messageSource.getMessage("equipment.getall.success", null, locale);

        ApiResponse<Page<EquipmentResponse>> response = ApiResponse.<Page<EquipmentResponse>>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EQUIPMENT_VIEW')")
    public ResponseEntity<ApiResponse<EquipmentResponse>> findById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        EquipmentResponse data = equipmentService.findById(id);
        String message = messageSource.getMessage("equipment.getbyid.success", null, locale);

        ApiResponse<EquipmentResponse> response = ApiResponse.<EquipmentResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EQUIPMENT_CREATE')")
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipment(
            @Valid @RequestBody EquipmentCreateDTO dto) {

        Locale locale = LocaleContextHolder.getLocale();

        EquipmentResponse data = equipmentService.createEquipment(dto);

        String message = messageSource.getMessage("equipment.add.success", null, locale);

        ApiResponse<EquipmentResponse> response = ApiResponse.<EquipmentResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EQUIPMENT_UPDATE')")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipment(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentCreateDTO dto) {

        Locale locale = LocaleContextHolder.getLocale();

        EquipmentResponse data = equipmentService.updateEquipment(id, dto);

        String message = messageSource.getMessage("equipment.update.success", null, locale);

        ApiResponse<EquipmentResponse> response = ApiResponse.<EquipmentResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EQUIPMENT_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteEquipment(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        equipmentService.deleteEquipment(id);
        String message = messageSource.getMessage("equipment.delete.success", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/assign-room")
    @PreAuthorize("hasAuthority('EQUIPMENT_UPDATE')")
    public ResponseEntity<ApiResponse<RoomEquipmentResponse>> assignToRoom(
            @PathVariable Long id,
            @Valid @RequestBody AssignEquipmentToRoomDTO dto) {

        RoomEquipmentResponse data = equipmentService.assignToRoom(id, dto);

        ApiResponse<RoomEquipmentResponse> response = ApiResponse.<RoomEquipmentResponse>builder()
                .success(true)
                .message("Assign equipment to room successfully")
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/rooms/{roomId}")
    @PreAuthorize("hasAuthority('EQUIPMENT_DELETE')")
    public ResponseEntity<ApiResponse<Void>> removeFromRoom(
            @PathVariable Long id,
            @PathVariable Long roomId) {

        equipmentService.removeFromRoom(id, roomId);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Remove equipment from room successfully")
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/rooms/{roomId}")
    @PreAuthorize("hasAuthority('EQUIPMENT_VIEW')")
    public ResponseEntity<ApiResponse<List<RoomEquipmentResponse>>> getEquipmentsByRoom(
            @PathVariable Long roomId) {

        List<RoomEquipmentResponse> data = equipmentService.getEquipmentsByRoom(roomId);

        ApiResponse<List<RoomEquipmentResponse>> response = ApiResponse.<List<RoomEquipmentResponse>>builder()
                .success(true)
                .message("Get room equipments successfully")
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    // Upload nhiều ảnh local cho 1 thiết bị
    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('EQUIPMENT_UPDATE')")
    public ResponseEntity<ApiResponse<List<EquipmentImageResponse>>> uploadImages(
            @PathVariable Long id,
            @RequestParam("images") List<MultipartFile> images) {

        List<EquipmentImageResponse> data = equipmentService.uploadImages(id, images);

        ApiResponse<List<EquipmentImageResponse>> response = ApiResponse.<List<EquipmentImageResponse>>builder()
                .success(true)
                .message("Upload equipment images successfully")
                .data(data)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}