package com.hms.common.filter;

import com.hms.service.audit.AuditLogService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ApiAuditLoggingFilter extends OncePerRequestFilter {

    private static final String API_PREFIX = "/api/v1/";
    private static final String AUDIT_LOG_PATH = "/api/v1/audit-logs";

    private final AuditLogService auditLogService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith(API_PREFIX) || path.startsWith(AUDIT_LOG_PATH);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long startedAt = System.currentTimeMillis();
        Exception failure = null;

        try {
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            failure = ex;
            throw ex;
        } finally {
            writeApiAuditLog(request, response, startedAt, failure);
        }
    }

    private void writeApiAuditLog(HttpServletRequest request, HttpServletResponse response, long startedAt, Exception failure) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        int statusCode = response.getStatus();
        boolean success = failure == null && statusCode < 400;

        String module = resolveModule(path);
        String resourceType = resolveResourceType(module);
        String resourceId = resolveResourceId(path);
        String action = resolveAction(method, path, module);

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("method", method);
        after.put("path", path);
        after.put("queryString", request.getQueryString());
        after.put("statusCode", statusCode);
        after.put("durationMs", System.currentTimeMillis() - startedAt);
        after.put("contentType", request.getContentType());
        after.put("acceptLanguage", request.getHeader("Accept-Language"));

        Map<String, Object> changes = auditLogService.changes(null, after);
        String resourceName = resourceId == null ? path : resourceType + " #" + resourceId;

        if (success) {
            auditLogService.logSuccess(action, module, resourceType, resourceId, resourceName, changes);
            return;
        }

        auditLogService.logFailure(
                action,
                module,
                resourceType,
                resourceId,
                resourceName,
                changes,
                failure == null ? new RuntimeException("HTTP " + statusCode) : failure
        );
    }

    private String resolveAction(String method, String path, String module) {
        String normalizedModule = module == null ? "API" : module;
        if (path.startsWith("/api/v1/auth/login")) {
            return "LOGIN_REQUEST";
        }
        if (path.startsWith("/api/v1/auth/register")) {
            return "REGISTER_REQUEST";
        }
        if (path.startsWith("/api/v1/auth/logout")) {
            return "LOGOUT";
        }

        return switch (method.toUpperCase(Locale.ROOT)) {
            case "GET" -> "VIEW_" + normalizedModule;
            case "POST" -> "CREATE_" + normalizedModule;
            case "PUT" -> "UPDATE_" + normalizedModule;
            case "PATCH" -> "UPDATE_" + normalizedModule;
            case "DELETE" -> "DELETE_" + normalizedModule;
            default -> method.toUpperCase(Locale.ROOT) + "_" + normalizedModule;
        };
    }

    private String resolveModule(String path) {
        String[] segments = path.substring(API_PREFIX.length()).split("/");
        if (segments.length == 0 || segments[0].isBlank()) {
            return "API";
        }
        String firstSegment = segments[0].replace("-", "_").toUpperCase(Locale.ROOT);
        return switch (firstSegment) {
            case "AUTH" -> "AUTH";
            case "ROOMS", "ROOM_TYPES" -> "ROOM";
            case "BOOKINGS", "CHECK_IN" -> "BOOKING";
            case "USERS", "ROLES", "PERMISSIONS" -> "USER";
            case "CUSTOMERS" -> "CUSTOMER";
            case "INVOICES" -> "BILLING";
            case "HOUSEKEEPING", "HOUSE_KEEPING_TASKS" -> "HOUSEKEEPING";
            case "MAINTENANCE" -> "MAINTENANCE";
            case "EQUIPMENT", "EQUIPMENTS" -> "EQUIPMENT";
            case "DASHBOARD", "REPORTS" -> "REPORT";
            default -> firstSegment;
        };
    }

    private String resolveResourceType(String module) {
        return switch (module) {
            case "AUTH" -> "AUTH_REQUEST";
            case "BILLING" -> "INVOICE";
            case "REPORT" -> "REPORT";
            default -> module;
        };
    }

    private String resolveResourceId(String path) {
        String[] segments = path.substring(API_PREFIX.length()).split("/");
        for (int i = 1; i < segments.length; i++) {
            String segment = segments[i];
            if (segment.matches("[0-9]+") || segment.matches("[0-9a-fA-F-]{20,}")) {
                return segment;
            }
        }
        return null;
    }
}
