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
    private Map<String, Object> message;
    private String status;
    private String errorMessage;
    private Instant createdAt;
}
