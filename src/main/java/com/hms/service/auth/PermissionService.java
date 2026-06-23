package com.hms.service.auth;

import com.hms.dto.auth.request.PermissionRequest;
import com.hms.dto.auth.response.PermissionResponse;

import java.util.List;

public interface PermissionService {
    List<PermissionResponse> getAllPermissions();
    PermissionResponse createPermission(PermissionRequest request);
    void deletePermission(Long id);
    PermissionResponse updatePermission(Long id,PermissionRequest request);
}
