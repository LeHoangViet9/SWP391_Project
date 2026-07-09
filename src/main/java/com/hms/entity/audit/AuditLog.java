package com.hms.entity.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id", updatable = false)
    private Long actorUserId;

    @Column(name = "actor_username", length = 100, updatable = false)
    private String actorUsername;

    @Column(name = "actor_role", length = 50, updatable = false)
    private String actorRole;

    @Column(name = "actor_email", length = 120, updatable = false)
    private String actorEmail;

    @Column(name = "action", nullable = false, length = 100, updatable = false)
    private String action;

    @Column(name = "module", nullable = false, length = 50, updatable = false)
    private String module;

    @Column(name = "resource_type", length = 80, updatable = false)
    private String resourceType;

    @Column(name = "resource_id", length = 80, updatable = false)
    private String resourceId;

    @Column(name = "resource_name", length = 255, updatable = false)
    private String resourceName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "changes", columnDefinition = "jsonb", updatable = false)
    private Map<String, Object> message;

    @Column(name = "ip_address", length = 64, updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", length = 512, updatable = false)
    private String userAgent;

    @Column(name = "status", nullable = false, length = 20, updatable = false)
    private String status;

    @Column(name = "error_message", length = 1000, updatable = false)
    private String errorMessage;

    @Column(name = "request_id", length = 100, updatable = false)
    private String requestId;

    @Column(name = "previous_hash", length = 64, updatable = false)
    private String previousHash;

    @Column(name = "row_hash", nullable = false, length = 64, updatable = false)
    private String rowHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
