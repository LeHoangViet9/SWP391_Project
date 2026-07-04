package com.hms.service.audit;

import com.hms.dto.audit.request.AuditLogRequest;
import com.hms.dto.audit.response.AuditLogResponse;
import org.springframework.data.domain.Page;

import java.time.Instant;
import java.util.Map;

public interface AuditLogService {

    void logSuccess(String action, String module, String resourceType, Object resourceId,
                    String resourceName, Map<String, Object> message);

    void logFailure(String action, String module, String resourceType, Object resourceId,
                    String resourceName, Map<String, Object> message, Exception exception);

    void log(AuditLogRequest request);

    Map<String, Object> message(Object before, Object after);

    Page<AuditLogResponse> search(String keyword, String action, String module, String resourceType,
                                  Long actorUserId, String status, Instant fromTime, Instant toTime,
                                  Integer page, Integer size);

    AuditLogResponse getById(Long id);
}
