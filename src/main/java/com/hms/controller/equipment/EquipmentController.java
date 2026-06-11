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
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final MessageSource messageSource;

    @GetMapping
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