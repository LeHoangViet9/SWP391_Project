package com.hms.dto.audit.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private Long actorUserId;
    private String actorUsername;
    private String actorRole;
    private String actorEmail;
    private String action;
    private String module;
    private String resourceType;
    private String resourceId;
    private String resourceName;
    private Map<String, Object> changes;
    private String ipAddress;
    private String userAgent;
    private String status;
    private String errorMessage;
    private String requestId;
    private String previousHash;
    private String rowHash;
    private Instant createdAt;
}
