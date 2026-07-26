package com.hms.service.auth.impl;

import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.auth.request.RoleRequest;
import com.hms.dto.auth.response.RoleResponse;
import com.hms.entity.auth.Permission;
import com.hms.entity.auth.Role;
import com.hms.repository.auth.PermissionRepository;
import com.hms.repository.auth.RoleRepository;
import com.hms.service.auth.IRoleService;
import com.hms.service.auth.mapper.RoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleServiceImpl implements IRoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RoleMapper roleMapper;
    private final MessageSource messageSource;

    /**
     * Get all vai trò (Role) trong hệ thống.
     * 
     * @return list of RoleResponse objects representing roles
     */
    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get details of a vai trò dựa trên ID.
     * 
     * @param id of role to find
     * @return RoleResponse object containing role info
     * @throws ResourceNotFoundException if role not found with provided ID
     */
    @Override
    public RoleResponse getRoleById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.notfound", null, locale)
                ));
        return roleMapper.toResponse(role);
    }

    /**
     * Create a new vai trò trong hệ thống kèm theo danh sách các quyền được gán.
     * 
     * @param request containing role name and permission IDs
     * @return RoleResponse object of created role
     * @throws ConflictException if role name already exists in system
     */
    @Override
    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        if (roleRepository.findByRoleNameIgnoreCase(request.getRoleName()).isPresent()) {
            throw new ConflictException(
                    messageSource.getMessage("error.role.exists", null, locale)
            );
        }

        List<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds());

        Role role = Role.builder()
                .roleName(request.getRoleName())
                .permissions(new HashSet<>(permissions))
                .build();

        return roleMapper.toResponse(roleRepository.save(role));
    }

    /**
     * Update information of a vai trò hiện có (tên vai trò và danh sách quyền).
     * 
     * @param id của vai trò cần cập nhật
     * @param request containing new update info for role
     * @return RoleResponse object of updated role
     * @throws ResourceNotFoundException if role not found with provided ID
     * @throws ConflictException if new role name duplicates another existing role
     */
    @Override
    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.notfound", null, locale)
                ));

        if (!role.getRoleName().equalsIgnoreCase(request.getRoleName())
                && roleRepository.findByRoleNameIgnoreCase(request.getRoleName()).isPresent()) {
            throw new ConflictException(
                    messageSource.getMessage("error.role.exists", null, locale)
            );
        }

        List<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds());

        role.setRoleName(request.getRoleName());
        role.setPermissions(new HashSet<>(permissions));

        return roleMapper.toResponse(roleRepository.save(role));
    }

    /**
     * Delete a vai trò khỏi hệ thống dựa trên ID.
     * 
     * @param id of role to delete
     * @throws ResourceNotFoundException if role not found with provided ID
     */
    @Override
    @Transactional
    public void deleteRole(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.notfound", null, locale)
                ));

        roleRepository.delete(role);
    }

    /**
     * Assign list of quyền hạn (Permissions) trực tiếp cho một vai trò.
     * 
     * @param roleId of role to assign permissions
     * @param permissionIds list of permission IDs to assign
     * @return RoleResponse object of role after assigning permissions
     * @throws ResourceNotFoundException if role not found with provided ID
     */
    @Override
    @Transactional
    public RoleResponse assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.notfound", null, locale)
                ));

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        role.setPermissions(new HashSet<>(permissions));

        return roleMapper.toResponse(roleRepository.save(role));
    }
}