package com.hms.common.security;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated() || !(permission instanceof String)) {
            return false;
        }

        String requiredPermission = (String) permission;

        // Permissions preloaded into SecurityContext bởi JwtAuthenticationFilter,
        // so only check authorities, no DB query needed.
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equalsIgnoreCase(requiredPermission));
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return hasPermission(authentication, null, permission);
    }
}
