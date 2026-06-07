package com.hms.controller.maintenance;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.service.maintenance.MaintenanceService;
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
@RequestMapping("/api/v1/maintenance-requests")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MaintenanceResponse>>> getAllRequests(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) MaintenanceSeverity severity,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();

        Page<MaintenanceResponse> data = maintenanceService.searchAndFilterRequests(
                keyword, status, severity, roomId, assignedToId, page, size, sortBy, direction
        );

        String message = messageSource.getMessage("success.maintenance.getall", null, locale);

        ApiResponse<Page<MaintenanceResponse>> response = ApiResponse.<Page<MaintenanceResponse>>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceResponse>> getRequestById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        MaintenanceResponse data = maintenanceService.getRequestById(id);
        String message = messageSource.getMessage("success.maintenance.getbyid", null, locale);

        ApiResponse<MaintenanceResponse> response = ApiResponse.<MaintenanceResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceResponse>> createRequest(
            @Valid @RequestBody MaintenanceRequestCreateDTO dto) {

        Locale locale = LocaleContextHolder.getLocale();

        MaintenanceResponse data = maintenanceService.createRequest(dto);
        String message = messageSource.getMessage("success.maintenance.create", null, locale);

        ApiResponse<MaintenanceResponse> response = ApiResponse.<MaintenanceResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceResponse>> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRequestUpdateDTO dto) {

        Locale locale = LocaleContextHolder.getLocale();

        MaintenanceResponse data = maintenanceService.updateRequest(id, dto);
        String message = messageSource.getMessage("success.maintenance.update", null, locale);

        ApiResponse<MaintenanceResponse> response = ApiResponse.<MaintenanceResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        maintenanceService.deleteRequest(id);
        String message = messageSource.getMessage("success.maintenance.delete", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}
