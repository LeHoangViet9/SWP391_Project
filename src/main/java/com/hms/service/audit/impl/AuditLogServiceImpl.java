package com.hms.service.audit.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.audit.SensitiveDataMasker;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.filter.RequestIdFilter;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.audit.request.AuditLogRequest;
import com.hms.dto.audit.response.AuditLogResponse;
import com.hms.entity.audit.AuditLog;
import com.hms.entity.auth.User;
import com.hms.repository.audit.AuditLogRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.audit.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SensitiveDataMasker sensitiveDataMasker;
    private final PageableUtils pageableUtils;
    private final MessageSource messageSource;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSuccess(String action, String module, String resourceType, Object resourceId,
                           String resourceName, Map<String, Object> message) {
        log(AuditLogRequest.builder()
                .action(action)
                .module(module)
                .resourceType(resourceType)
                .resourceId(toStringOrNull(resourceId))
                .resourceName(resourceName)
                .message(message)
                .status("SUCCESS")
                .build());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(String action, String module, String resourceType, Object resourceId,
                           String resourceName, Map<String, Object> message, Exception exception) {
        log(AuditLogRequest.builder()
                .action(action)
                .module(module)
                .resourceType(resourceType)
                .resourceId(toStringOrNull(resourceId))
                .resourceName(resourceName)
                .message(message)
                .status("FAILED")
                .errorMessage(exception == null ? null : truncate(exception.getMessage(), 1000))
                .build());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AuditLogRequest request) {
        try {
            Instant now = Instant.now();
            Optional<User> actor = getCurrentActor();
            
            // Resolve the actor from the user repository for LOGIN_SUCCESS and LOGIN_FAILED actions
            // since the Spring Security context is not yet populated during these actions.
            if (actor.isEmpty() && request.getAction() != null) {
                if ("LOGIN_SUCCESS".equals(request.getAction()) && request.getResourceId() != null) {
                    try {
                        Long userId = Long.parseLong(request.getResourceId());
                        actor = userRepository.findById(userId);
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                } else if ("LOGIN_FAILED".equals(request.getAction()) && request.getResourceName() != null) {
                    actor = userRepository.findUserByEmail(request.getResourceName());
                }
            }

            HttpServletRequest servletRequest = getCurrentRequest();
            String previousHash = auditLogRepository.findTopByOrderByIdDesc()
                    .map(AuditLog::getRowHash)
                    .orElse(null);

            AuditLog auditLog = AuditLog.builder()
                    .actorUserId(actor.map(User::getId).orElse(null))
                    .actorUsername(actor.map(User::getFullName).orElse(getPrincipalName()))
                    .actorRole(actor.map(user -> user.getRole() == null ? null : user.getRole().getRoleName()).orElse(null))
                    .actorEmail(actor.map(User::getEmail).orElse(getPrincipalName()))
                    .action(request.getAction())
                    .module(request.getModule())
                    .resourceType(request.getResourceType())
                    .resourceId(request.getResourceId())
                    .resourceName(request.getResourceName())
                    .message(maskMessage(request.getMessage()))
                    .ipAddress(resolveIpAddress(servletRequest))
                    .userAgent(truncate(servletRequest == null ? null : servletRequest.getHeader("User-Agent"), 512))
                    .status(request.getStatus() == null ? "SUCCESS" : request.getStatus())
                    .errorMessage(truncate(request.getErrorMessage(), 1000))
                    .requestId(resolveRequestId(servletRequest))
                    .previousHash(previousHash)
                    .createdAt(now)
                    .build();

            auditLog.setRowHash(hash(auditLog));
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Cannot write audit log for action {}: {}", request.getAction(), e.getMessage());
        }
    }

    @Override
    public Map<String, Object> message(Object before, Object after) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("before", toMap(before));
        message.put("after", toMap(after));
        return message;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(String keyword, String action, String module, String resourceType,
                                         Long actorUserId, String status, Instant fromTime, Instant toTime,
                                         Integer page, Integer size) {
        // 1. Tạo Pageable phân trang và sắp xếp mặc định
        Pageable pageable = pageableUtils.createPageable(page, size, "id", com.hms.common.enums.SortDirection.DESC);

        // 2. Chuẩn hóa keyword trước khi truyền xuống (nếu rỗng hoặc toàn dấu cách thì đưa về null)
        // 3. Gọi thẳng Repository rồi map sang DTO Response
        return auditLogRepository.findAll(buildSearchSpec(keyword, action, module, resourceType, actorUserId, status, fromTime, toTime), pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogResponse getById(Long id) {
        return auditLogRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log not found"));
    }

    private Optional<User> getCurrentActor() {
        String principalName = getPrincipalName();
        if (principalName == null || "anonymousUser".equals(principalName)) {
            return Optional.empty();
        }
        return userRepository.findUserByEmail(principalName);
    }

    private String getPrincipalName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "ANONYMOUS";
        }
        return authentication.getName();
    }

    private HttpServletRequest getCurrentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest();
        }
        return null;
    }

    private String resolveIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return truncate(forwardedFor.split(",")[0].trim(), 64);
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return truncate(realIp, 64);
        }
        return truncate(request.getRemoteAddr(), 64);
    }

    private String resolveRequestId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        Object attribute = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        if (attribute != null) {
            return truncate(String.valueOf(attribute), 100);
        }
        return truncate(request.getHeader(RequestIdFilter.REQUEST_ID_HEADER), 100);
    }

    private Map<String, Object> maskMessage(Map<String, Object> message) {
        if (message == null) {
            return null;
        }
        try {
            Map<String, Object> converted = objectMapper.convertValue(message, MAP_TYPE);
            return sensitiveDataMasker.maskMap(converted);
        } catch (Exception e) {
            log.warn("Failed to convert message for masking: {}", e.getMessage());
            return sensitiveDataMasker.maskMap(message);
        }
    }

    private Object toMap(Object source) {
        if (source == null) {
            return null;
        }
        try {
            Object converted = objectMapper.convertValue(source, Object.class);
            return sensitiveDataMasker.mask(converted);
        } catch (Exception e) {
            log.warn("Failed to convert source to map/list representation: {}", e.getMessage());
            Object masked = sensitiveDataMasker.mask(source);
            return objectMapper.convertValue(masked, Object.class);
        }
    }

    private String hash(AuditLog auditLog) throws JsonProcessingException {
        Map<String, Object> hashPayload = new LinkedHashMap<>();
        hashPayload.put("previousHash", auditLog.getPreviousHash());
        hashPayload.put("actorUserId", auditLog.getActorUserId());
        hashPayload.put("actorUsername", auditLog.getActorUsername());
        hashPayload.put("actorRole", auditLog.getActorRole());
        hashPayload.put("actorEmail", auditLog.getActorEmail());
        hashPayload.put("action", auditLog.getAction());
        hashPayload.put("module", auditLog.getModule());
        hashPayload.put("resourceType", auditLog.getResourceType());
        hashPayload.put("resourceId", auditLog.getResourceId());
        hashPayload.put("resourceName", auditLog.getResourceName());
        hashPayload.put("message", auditLog.getMessage());
        hashPayload.put("ipAddress", auditLog.getIpAddress());
        hashPayload.put("userAgent", auditLog.getUserAgent());
        hashPayload.put("status", auditLog.getStatus());
        hashPayload.put("errorMessage", auditLog.getErrorMessage());
        hashPayload.put("requestId", auditLog.getRequestId());
        hashPayload.put("createdAt", auditLog.getCreatedAt().toString());
        return sha256(objectMapper.writeValueAsString(hashPayload));
    }

    private String sha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        String actionLabel = resolveLabel("audit.action." + auditLog.getAction(), auditLog.getAction());
        
        String actorUsername = auditLog.getActorUsername();
        String actorRole = auditLog.getActorRole();
        String actorEmail = auditLog.getActorEmail();

        boolean isAnonymous = "anonymousUser".equalsIgnoreCase(actorUsername) 
                || "ANONYMOUS".equalsIgnoreCase(actorUsername) 
                || actorUsername == null;

        if (isAnonymous) {
            actorUsername = resolveLabel("audit.actor.anonymous", "Anonymous");
            actorRole = resolveLabel("audit.role.anonymous", "ANONYMOUS");
            actorEmail = "";
        } else {
            if (actorRole == null || actorRole.isBlank()) {
                actorRole = resolveLabel("audit.role.none", "-");
            }
        }

        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .actorUserId(auditLog.getActorUserId())
                .actorUsername(actorUsername)
                .actorRole(actorRole)
                .actorEmail(actorEmail)
                .action(auditLog.getAction())
                .actionLabel(actionLabel)
                .module(auditLog.getModule())
                .moduleLabel(resolveLabel("audit.module." + auditLog.getModule(), auditLog.getModule()))
                .message(auditLog.getMessage())
                .status(auditLog.getStatus())
                .statusLabel(resolveLabel("audit.status." + auditLog.getStatus(), auditLog.getStatus()))
                .messageText(buildMessageText(auditLog, actionLabel))
                .errorMessage(auditLog.getErrorMessage())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }

    /**
     * Build a human-readable notification message for the audit log entry.
     * Uses notification templates from message properties with {0}=resourceName, {1}=actorUsername.
     * Falls back to actionLabel if no specific template is found.
     */
    private String buildMessageText(AuditLog auditLog, String actionLabel) {
        try {
            String resourceName = auditLog.getResourceName();
            String actorName = auditLog.getActorUsername();

            // Clean up resourceName if it's a technical path or generic RESOURCE #ID
            if (resourceName == null || resourceName.isBlank()) {
                resourceName = "";
            } else {
                resourceName = resourceName.trim();
                if (resourceName.startsWith("/") || resourceName.matches("^[A-Z_\\-]+ #[0-9]+$")) {
                    resourceName = "";
                }
            }

            if (actorName == null || actorName.isBlank()) {
                actorName = auditLog.getActorEmail() != null ? auditLog.getActorEmail() : "System";
            }

            String key = "audit.notification." + auditLog.getAction();
            String template = messageSource.getMessage(key, null, null, LocaleContextHolder.getLocale());

            if (template != null) {
                if (resourceName.isEmpty()) {
                    // Clean up the placeholder and any preceding colon/spaces to make it natural
                    template = template.replace(": {0}", "")
                                       .replace(" {0}", "")
                                       .replace("{0}", "");
                }
                return messageSource.getMessage(key, new Object[]{resourceName, actorName}, template, LocaleContextHolder.getLocale());
            }

            // Fallback: actionLabel + resourceName
            if (!resourceName.isEmpty()) {
                return actionLabel + ": " + resourceName;
            }
            return actionLabel;
        } catch (Exception e) {
            return actionLabel;
        }
    }

    /**
     * Resolve a message key to a localized label.
     * Falls back to the provided defaultValue if the key is not found.
     */
    private String resolveLabel(String key, String defaultValue) {
        try {
            return messageSource.getMessage(key, null, defaultValue, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private Specification<AuditLog> buildSearchSpec(String keyword, String action, String module, String resourceType,
                                                    Long actorUserId, String status,
                                                    Instant fromTime, Instant toTime) {
        return (root, query, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();

            String normalizedKeyword = blankToNull(keyword);
            if (normalizedKeyword != null) {
                String pattern = "%" + normalizedKeyword.toLowerCase() + "%";
                var keywordPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("action")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("module")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("resourceType")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("status")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("actorUsername")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("resourceName")), pattern)
                );
                predicate = criteriaBuilder.and(predicate, keywordPredicate);
            }

            String normalizedAction = blankToNull(action);
            if (normalizedAction != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("action"), normalizedAction));
            }

            String normalizedModule = blankToNull(module);
            if (normalizedModule != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("module"), normalizedModule));
            }

            String normalizedResourceType = blankToNull(resourceType);
            if (normalizedResourceType != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("resourceType"), normalizedResourceType));
            }

            if (actorUserId != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("actorUserId"), actorUserId));
            }

            String normalizedStatus = blankToNull(status);
            if (normalizedStatus != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("status"), normalizedStatus));
            }

            if (fromTime != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), fromTime));
            }

            if (toTime != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), toTime));
            }

            return predicate;
        };
    }

    private String toStringOrNull(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
