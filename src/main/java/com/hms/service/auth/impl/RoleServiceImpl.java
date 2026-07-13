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
     * Lấy danh sách tất cả các vai trò (Role) trong hệ thống.
     * 
     * @return danh sách đối tượng RoleResponse đại diện cho các vai trò
     */
    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết của một vai trò dựa trên ID.
     * 
     * @param id của vai trò cần tìm
     * @return đối tượng RoleResponse chứa thông tin vai trò
     * @throws ResourceNotFoundException nếu không tìm thấy vai trò với ID cung cấp
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
     * Tạo mới một vai trò trong hệ thống kèm theo danh sách các quyền được gán.
     * 
     * @param request chứa thông tin tên vai trò và danh sách ID quyền hạn
     * @return đối tượng RoleResponse của vai trò mới tạo
     * @throws ConflictException nếu tên vai trò đã tồn tại trong hệ thống
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
     * Cập nhật thông tin của một vai trò hiện có (tên vai trò và danh sách quyền).
     * 
     * @param id của vai trò cần cập nhật
     * @param request chứa thông tin cập nhật mới của vai trò
     * @return đối tượng RoleResponse của vai trò sau khi cập nhật
     * @throws ResourceNotFoundException nếu không tìm thấy vai trò với ID cung cấp
     * @throws ConflictException nếu tên vai trò mới trùng lặp với một vai trò khác đã có
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
     * Xóa một vai trò khỏi hệ thống dựa trên ID.
     * 
     * @param id của vai trò cần xóa
     * @throws ResourceNotFoundException nếu không tìm thấy vai trò với ID cung cấp
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
     * Gán danh sách quyền hạn (Permissions) trực tiếp cho một vai trò.
     * 
     * @param roleId của vai trò cần gán quyền
     * @param permissionIds danh sách ID quyền hạn cần gán
     * @return đối tượng RoleResponse của vai trò sau khi gán lại quyền
     * @throws ResourceNotFoundException nếu không tìm thấy vai trò với ID cung cấp
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