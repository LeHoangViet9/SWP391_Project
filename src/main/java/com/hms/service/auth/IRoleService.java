package com.hms.service.auth;
import com.hms.dto.auth.request.RoleRequest;
import com.hms.dto.auth.response.RoleResponse;

import java.util.List;
public interface IRoleService {
    List<RoleResponse> getAllRoles();
    RoleResponse getRoleById(Long id);
    RoleResponse createRole(RoleRequest request);
    RoleResponse updateRole(Long id, RoleRequest request);
    void deleteRole(Long id);
    RoleResponse assignPermissionsToRole(Long roleId, List<Long> permissionIds);
}
