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

    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RoleResponse getRoleById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.notfound", null, locale)
                ));
        return roleMapper.toResponse(role);
    }

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
                .permissions(permissions)
                .build();

        return roleMapper.toResponse(roleRepository.save(role));
    }

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
        role.setPermissions(permissions);

        return roleMapper.toResponse(roleRepository.save(role));
    }

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

    @Override
    @Transactional
    public RoleResponse assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.notfound", null, locale)
                ));

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        role.setPermissions(permissions);

        return roleMapper.toResponse(roleRepository.save(role));
    }
}