
package com.hms.service.auth.impl;

import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.auth.request.PermissionRequest;
import com.hms.dto.auth.response.PermissionResponse;
import com.hms.entity.auth.Permission;
import com.hms.repository.auth.PermissionRepository;
import com.hms.service.auth.PermissionService;
import com.hms.service.auth.mapper.PermissionMapper;
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
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;
    private final MessageSource messageSource;

    @Override
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        if (permissionRepository.existsByName(request.getName())) {
            throw new ConflictException(
                    messageSource.getMessage("error.permission.exists", null, locale)
            );
        }

        Permission permission = Permission.builder()
                .name(request.getName())
                .build();

        return permissionMapper.toResponse(permissionRepository.save(permission));
    }

    @Override
    @Transactional
    public PermissionResponse updatePermission(Long id, PermissionRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.permission.notfound", null, locale)
                ));

        if (!permission.getName().equals(request.getName())
                && permissionRepository.existsByName(request.getName())) {
            throw new ConflictException(
                    messageSource.getMessage("error.permission.exists", null, locale)
            );
        }

        permission.setName(request.getName());
        return permissionMapper.toResponse(permissionRepository.save(permission));
    }

    @Override
    @Transactional
    public void deletePermission(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.permission.notfound", null, locale)
                ));

        permissionRepository.delete(permission);
    }
}