package com.hms.common.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

public class SecurityUtils {

    public static String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() != null && !authentication.getPrincipal().equals("anonymousUser")) {
            return authentication.getName(); // Usually email or username
        }
        return "System";
    }

    public static String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xForwardedForHeader = request.getHeader("X-Forwarded-For");
            if (xForwardedForHeader == null) {
                return request.getRemoteAddr();
            }
            return xForwardedForHeader.split(",")[0];
        }
        return "Unknown";
    }
}