package com.hms.controller.maintenance;

import com.hms.common.dto.ApiResponse;
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

    /**
     * Tạo yêu cầu bảo trì mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceResponse>> createRequest(
            @Valid @RequestBody MaintenanceRequestCreateDTO dto
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        MaintenanceResponse created = maintenanceService.createRequest(dto);
        String message = messageSource.getMessage("maintenance.add.success", null, locale);

        ApiResponse<MaintenanceResponse> response = ApiResponse.<MaintenanceResponse>builder()
                .success(true)
                .message(message)
                .data(created)
                .status(HttpStatus.CREATED)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách tất cả yêu cầu bảo trì (có phân trang)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<MaintenanceResponse>>> getAllRequests(
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("maintenance.getall.success", null, locale);

        ApiResponse<Page<MaintenanceResponse>> response = ApiResponse.<Page<MaintenanceResponse>>builder()
                .success(true)
                .message(message)
                .data(maintenanceService.getAllRequests(
                        keywords,
                        page,
                        size,
                        sortBy,
                        direction))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Lấy chi tiết yêu cầu bảo trì theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceResponse>> getRequestById(
            @PathVariable Long id
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        MaintenanceResponse maintenance = maintenanceService.getRequestById(id);
        String message = messageSource.getMessage("maintenance.getbyid.success", null, locale);

        ApiResponse<MaintenanceResponse> response = ApiResponse.<MaintenanceResponse>builder()
                .success(true)
                .message(message)
                .data(maintenance)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Cập nhật yêu cầu bảo trì
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceResponse>> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRequestUpdateDTO dto
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        MaintenanceResponse updated = maintenanceService.updateRequest(id, dto);
        String message = messageSource.getMessage("maintenance.update.success", null, locale);

        ApiResponse<MaintenanceResponse> response = ApiResponse.<MaintenanceResponse>builder()
                .success(true)
                .message(message)
                .data(updated)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    /**
     * Xóa yêu cầu bảo trì
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(
            @PathVariable Long id
    ) {
        Locale locale = LocaleContextHolder.getLocale();
        maintenanceService.deleteRequest(id);
        String message = messageSource.getMessage("maintenance.delete.success", null, locale);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}