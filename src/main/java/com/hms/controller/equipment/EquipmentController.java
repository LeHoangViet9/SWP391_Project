package com.hms.controller.equipment;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.service.equipment.EquipmentService;
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
@RequestMapping("/api/v1/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final MessageSource messageSource;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MAINTENANCE', 'RECEPTIONIST', 'HOUSEKEEPING')")
    public ResponseEntity<ApiResponse<Page<EquipmentResponse>>> getAllEquipments(
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String equipmentName,
            @RequestParam(required = false) String equipmentCode,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) com.hms.common.enums.EquipmentStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();

        Page<EquipmentResponse> data = equipmentService.getAllEquipments(
                id,
                equipmentName,
                equipmentCode,
                location,
                roomId,
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MAINTENANCE', 'RECEPTIONIST', 'HOUSEKEEPING')")
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

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipment(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @Valid @ModelAttribute EquipmentCreateDTO dto) {

        Locale locale = LocaleContextHolder.getLocale();

        EquipmentResponse data = equipmentService.createEquipment(dto, file);
        String message = messageSource.getMessage("equipment.add.success", null, locale);

        ApiResponse<EquipmentResponse> response = ApiResponse.<EquipmentResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MAINTENANCE')")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipment(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @Valid @ModelAttribute EquipmentCreateDTO dto) {

        Locale locale = LocaleContextHolder.getLocale();

        EquipmentResponse data = equipmentService.updateEquipment(id, dto, file);
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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
}