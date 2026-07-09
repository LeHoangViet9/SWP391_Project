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
    private String actionLabel;
    private String module;
    private String moduleLabel;
    private Map<String, Object> message;
    private String status;
    private String statusLabel;
    private String messageText;
    private String errorMessage;
    private Instant createdAt;
}
