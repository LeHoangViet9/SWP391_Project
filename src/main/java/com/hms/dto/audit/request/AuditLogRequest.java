package com.hms.dto.audit.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequest {
    private String action;
    private String module;
    private String resourceType;
    private String resourceId;
    private String resourceName;
    private Map<String, Object> changes;
    private String status;
    private String errorMessage;
}
