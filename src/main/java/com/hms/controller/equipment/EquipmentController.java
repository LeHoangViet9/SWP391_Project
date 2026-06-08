package com.hms.controller.equipment;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.EquipmentCheckCreateDTO;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.request.EquipmentImageCreateDTO;
import com.hms.dto.equipment.response.EquipmentCheckResponse;
import com.hms.dto.equipment.response.EquipmentImageResponse;
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

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EquipmentResponse>>> getAllEquipments(
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();

        Page<EquipmentResponse> data = equipmentService.getAllEquipments(
                keywords,
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

    // =========================
    // ADDED: Equipment Images API
    // =========================

    @PostMapping("/{equipmentId}/images")
    public ResponseEntity<ApiResponse<EquipmentImageResponse>> addImage(
            @PathVariable Long equipmentId,
            @Valid @RequestBody EquipmentImageCreateDTO dto) {

        EquipmentImageResponse data = equipmentService.addImage(equipmentId, dto);

        ApiResponse<EquipmentImageResponse> response = ApiResponse.<EquipmentImageResponse>builder()
                .success(true)
                .message("Add equipment image successfully")
                .data(data)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{equipmentId}/images")
    public ResponseEntity<ApiResponse<List<EquipmentImageResponse>>> getImages(
            @PathVariable Long equipmentId) {

        List<EquipmentImageResponse> data = equipmentService.getImages(equipmentId);

        ApiResponse<List<EquipmentImageResponse>> response = ApiResponse.<List<EquipmentImageResponse>>builder()
                .success(true)
                .message("Get equipment images successfully")
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{equipmentId}/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long equipmentId,
            @PathVariable Long imageId) {

        equipmentService.deleteImage(equipmentId, imageId);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Delete equipment image successfully")
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    // =========================
    // ADDED: Equipment Checks API
    // =========================

    @PostMapping("/{equipmentId}/checks")
    public ResponseEntity<ApiResponse<EquipmentCheckResponse>> addCheck(
            @PathVariable Long equipmentId,
            @Valid @RequestBody EquipmentCheckCreateDTO dto) {

        EquipmentCheckResponse data = equipmentService.addCheck(equipmentId, dto);

        ApiResponse<EquipmentCheckResponse> response = ApiResponse.<EquipmentCheckResponse>builder()
                .success(true)
                .message("Add equipment check successfully")
                .data(data)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{equipmentId}/checks")
    public ResponseEntity<ApiResponse<List<EquipmentCheckResponse>>> getChecks(
            @PathVariable Long equipmentId) {

        List<EquipmentCheckResponse> data = equipmentService.getChecks(equipmentId);

        ApiResponse<List<EquipmentCheckResponse>> response = ApiResponse.<List<EquipmentCheckResponse>>builder()
                .success(true)
                .message("Get equipment checks successfully")
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{equipmentId}/checks/{checkId}")
    public ResponseEntity<ApiResponse<Void>> deleteCheck(
            @PathVariable Long equipmentId,
            @PathVariable Long checkId) {

        equipmentService.deleteCheck(equipmentId, checkId);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Delete equipment check successfully")
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}