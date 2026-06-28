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

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSuccess(String action, String module, String resourceType, Object resourceId,
                           String resourceName, Map<String, Object> changes) {
        log(AuditLogRequest.builder()
                .action(action)
                .module(module)
                .resourceType(resourceType)
                .resourceId(toStringOrNull(resourceId))
                .resourceName(resourceName)
                .changes(changes)
                .status("SUCCESS")
                .build());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(String action, String module, String resourceType, Object resourceId,
                           String resourceName, Map<String, Object> changes, Exception exception) {
        log(AuditLogRequest.builder()
                .action(action)
                .module(module)
                .resourceType(resourceType)
                .resourceId(toStringOrNull(resourceId))
                .resourceName(resourceName)
                .changes(changes)
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
                    .changes(maskChanges(request.getChanges()))
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
    public Map<String, Object> changes(Object before, Object after) {
        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("before", toMap(before));
        changes.put("after", toMap(after));
        return changes;
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

    private Map<String, Object> maskChanges(Map<String, Object> changes) {
        if (changes == null) {
            return null;
        }
        try {
            Map<String, Object> converted = objectMapper.convertValue(changes, MAP_TYPE);
            return sensitiveDataMasker.maskMap(converted);
        } catch (Exception e) {
            log.warn("Failed to convert changes for masking: {}", e.getMessage());
            return sensitiveDataMasker.maskMap(changes);
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
        hashPayload.put("changes", auditLog.getChanges());
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
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .actorUserId(auditLog.getActorUserId())
                .actorUsername(auditLog.getActorUsername())
                .actorRole(auditLog.getActorRole())
                .actorEmail(auditLog.getActorEmail())
                .action(auditLog.getAction())
                .module(auditLog.getModule())
                .resourceType(auditLog.getResourceType())
                .resourceId(auditLog.getResourceId())
                .resourceName(auditLog.getResourceName())
                .changes(auditLog.getChanges())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .status(auditLog.getStatus())
                .errorMessage(auditLog.getErrorMessage())
                .requestId(auditLog.getRequestId())
                .previousHash(auditLog.getPreviousHash())
                .rowHash(auditLog.getRowHash())
                .createdAt(auditLog.getCreatedAt())
                .build();
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
