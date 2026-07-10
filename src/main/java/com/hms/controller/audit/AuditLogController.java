package com.hms.controller.audit;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.audit.response.AuditLogResponse;
import com.hms.service.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') and hasAuthority('AUDIT_LOG_VIEW')")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) Long actorUserId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toTime,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        ApiResponse<Page<AuditLogResponse>> response = ApiResponse.<Page<AuditLogResponse>>builder()
                .success(true)
                .message("Get audit logs successfully")
                .data(auditLogService.search(keyword, action, module, null, actorUserId, status, fromTime, toTime, page, size))
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}
