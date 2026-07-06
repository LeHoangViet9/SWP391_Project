package com.hms.service.auth.impl;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.enums.StaffWorkStatus;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ForbiddenException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.auth.request.UserManagementRequest;
import com.hms.dto.auth.response.UserResponse;
import com.hms.entity.auth.Permission;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import com.hms.repository.auth.PermissionRepository;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.auth.IUserService;
import com.hms.service.auth.mapper.UserMapper;
import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.LinkedHashMap;
import com.hms.service.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hms.common.audit.Auditable;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class UserServiceImpl implements IUserService {

    private static final String ERROR_EMAIL_EXISTS = "error.email.exists";
    private static final String ERROR_PHONE_EXISTS = "error.phone.exists";
    private static final String ERROR_USER_INVALID = "error.user.invalid";
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_MANAGER = "MANAGER";
    private static final String ROLE_CUSTOMER = "CUSTOMER";
    private static final String ROLE_AUTHORITY_PREFIX = "ROLE_";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final MessageSource messageSource;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final PageableUtils pageableUtils;
    private final AuditLogService auditLogService;

    @Override
    public Page<UserResponse> getUsers(
            Long id, String fullName, String email, String phone, String roleName, AccountStatus status,
            Integer page, Integer size, SortField sortBy, SortDirection direction) {
        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        // Loại trừ CUSTOMER khỏi danh sách quản lý nhân viên
        Page<User> userPage = userRepository.searchEmployees(id, fullName, email, phone, roleName, status, pageable);
        return userPage.map(user -> userMapper.toResponse(user, null));
    }

    @Override
    @Transactional
    @Auditable(action = "CREATE_USER", module = "USER", logSuccess = false)
    public UserResponse createUser(UserManagementRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        validatePasswordForManagement(request, true, locale);

        // Validate role assignment based on the actor role.
        validateCreatableRole(request.getRoleName(), locale);

        if (userRepository.existsUserByEmail(request.getEmail())) {
            throw new ConflictException(messageSource.getMessage(ERROR_EMAIL_EXISTS, null, locale));
        }
        if (userRepository.existsUserByPhone(request.getPhone())) {
            throw new ConflictException(messageSource.getMessage(ERROR_PHONE_EXISTS, null, locale));
        }

        Role role = findRole(request.getRoleName(), locale);
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .accountStatus(request.getAccountStatus() == null ? AccountStatus.ACTIVE : request.getAccountStatus())
                .workStatus(resolveWorkStatus(request.getRoleName(), request.getWorkStatus()))
                .role(role)
                .build();

        User saved = userRepository.save(user);
        auditLogService.logSuccess(
                "CREATE_USER",
                "USER",
                "USER",
                saved.getId(),
                saved.getEmail(),
                auditLogService.message(null, userAuditSnapshot(saved))
        );
        return userMapper.toResponse(saved, null);
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_USER", module = "USER", logSuccess = false)
    public UserResponse updateUser(Long id, UserManagementRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));
        Map<String, Object> before = userAuditSnapshot(user);
        String previousRole = user.getRole() == null ? null : user.getRole().getRoleName();

        validatePasswordForManagement(request, false, locale);

        // Validate role assignment based on the actor role.
        validateAssignableRole(request.getRoleName(), locale);

        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new ConflictException(messageSource.getMessage(ERROR_EMAIL_EXISTS, null, locale));
        }
        if (!user.getPhone().equals(request.getPhone())
                && userRepository.existsByPhoneAndIdNot(request.getPhone(), id)) {
            throw new ConflictException(messageSource.getMessage(ERROR_PHONE_EXISTS, null, locale));
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRole(findRole(request.getRoleName(), locale));
        user.setAccountStatus(request.getAccountStatus() == null ? AccountStatus.ACTIVE : request.getAccountStatus());
        user.setWorkStatus(resolveWorkStatus(request.getRoleName(), request.getWorkStatus()));

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updated = userRepository.save(user);
        String action = previousRole != null && !previousRole.equalsIgnoreCase(updated.getRole().getRoleName())
                ? "UPDATE_ROLE"
                : "UPDATE_USER";
        auditLogService.logSuccess(
                action,
                "USER",
                "USER",
                updated.getId(),
                updated.getEmail(),
                auditLogService.message(before, userAuditSnapshot(updated))
        );
        return userMapper.toResponse(updated, null);
    }

    @Override
    @Transactional
    @Auditable(action = "DELETE_USER", module = "USER", logSuccess = false)
    public void deleteUser(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));
        Map<String, Object> before = userAuditSnapshot(user);
        user.setAccountStatus(AccountStatus.INACTIVE);
        User deleted = userRepository.save(user);
        auditLogService.logSuccess(
                "DELETE_USER",
                "USER",
                "USER",
                deleted.getId(),
                deleted.getEmail(),
                auditLogService.message(before, userAuditSnapshot(deleted))
        );
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_USER_PERMISSIONS", module = "USER", logSuccess = false)
    public UserResponse assignPermissionsToUser(Long userId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));
        Map<String, Object> before = userAuditSnapshot(user);

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);

        if (permissions.isEmpty()) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage("error.permission.notfound", null, locale)
            );
        }

        // Gán quyền mới (ghi đè sử dụng Set để tránh trùng dữ liệu)
        user.setCustomPermissions(new HashSet<>(permissions));

        User updated = userRepository.save(user);
        auditLogService.logSuccess(
                "UPDATE_USER_PERMISSIONS",
                "USER",
                "USER",
                updated.getId(),
                updated.getEmail(),
                auditLogService.message(before, userAuditSnapshot(updated))
        );
        return userMapper.toResponse(updated, null);
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_USER_PERMISSIONS", module = "USER", logSuccess = false)
    public UserResponse removePermissionsFromUser(Long userId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));
        Map<String, Object> before = userAuditSnapshot(user);

        if (user.getCustomPermissions() != null) {
            user.getCustomPermissions().removeIf(p -> permissionIds.contains(p.getId()));
        }

        User updated = userRepository.save(user);
        auditLogService.logSuccess(
                "UPDATE_USER_PERMISSIONS",
                "USER",
                "USER",
                updated.getId(),
                updated.getEmail(),
                auditLogService.message(before, userAuditSnapshot(updated))
        );
        return userMapper.toResponse(updated, null);
    }

    @Override
    public UserResponse getUserPermissions(Long userId) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));

        return userMapper.toResponse(user, null);
    }

    private Role findRole(String roleName, Locale locale) {
        return roleRepository.findByRoleNameIgnoreCase(roleName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.invalid", new Object[]{roleName}, locale)
                ));
    }

    private void validateCreatableRole(String requestedRoleName, Locale locale) {
        String requestedRole = normalizeRole(requestedRoleName);
        if (ROLE_CUSTOMER.equals(requestedRole)) {
            throw new ForbiddenException(messageSource.getMessage("error.user.create.customer.disabled", null, locale));
        }

        String actorRole = getCurrentActorRole();
        if (ROLE_ADMIN.equals(actorRole)) {
            if (ROLE_ADMIN.equals(requestedRole)) {
                throw new ForbiddenException(messageSource.getMessage("error.user.create.admin.disabled", null, locale));
            }
            return;
        }

        if (ROLE_MANAGER.equals(actorRole)) {
            if (ROLE_ADMIN.equals(requestedRole) || ROLE_MANAGER.equals(requestedRole)) {
                throw new ForbiddenException(messageSource.getMessage("error.user.create.manager.disabled", null, locale));
            }
            return;
        }

        throw new ForbiddenException(messageSource.getMessage("error.user.create.role.denied", null, locale));
    }

    private void validateAssignableRole(String requestedRoleName, Locale locale) {
        String requestedRole = normalizeRole(requestedRoleName);
        if (ROLE_CUSTOMER.equals(requestedRole)) {
            throw new ForbiddenException(messageSource.getMessage("error.user.update.customer.disabled", null, locale));
        }

        String actorRole = getCurrentActorRole();
        if (ROLE_ADMIN.equals(actorRole)) {
            if (ROLE_ADMIN.equals(requestedRole)) {
                throw new ForbiddenException(messageSource.getMessage("error.user.update.admin.disabled", null, locale));
            }
            return;
        }

        if (ROLE_MANAGER.equals(actorRole)) {
            if (ROLE_ADMIN.equals(requestedRole)) {
                throw new ForbiddenException(messageSource.getMessage("error.user.update.admin.disabled", null, locale));
            }
            if (ROLE_MANAGER.equals(requestedRole)) {
                throw new ForbiddenException(messageSource.getMessage("error.user.update.manager.disabled", null, locale));
            }
            return;
        }

        throw new ForbiddenException(messageSource.getMessage("error.user.update.role.denied", null, locale));
    }

    private String getCurrentActorRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority != null && authority.toUpperCase(Locale.ROOT).startsWith(ROLE_AUTHORITY_PREFIX))
                .map(authority -> authority.substring(ROLE_AUTHORITY_PREFIX.length()).toUpperCase(Locale.ROOT))
                .filter(role -> ROLE_ADMIN.equals(role) || ROLE_MANAGER.equals(role))
                .findFirst()
                .orElse(null);
    }

    private String normalizeRole(String roleName) {
        return roleName == null ? "" : roleName.trim().toUpperCase(Locale.ROOT);
    }

    private StaffWorkStatus resolveWorkStatus(String roleName, StaffWorkStatus requestedStatus) {
        if (!"HOUSEKEEPER".equals(normalizeRole(roleName))) {
            return StaffWorkStatus.AVAILABLE;
        }
        return requestedStatus == null ? StaffWorkStatus.AVAILABLE : requestedStatus;
    }

    private void validatePasswordForManagement(UserManagementRequest request, boolean required, Locale locale) {
        String password = request.getPassword();
        boolean blankPassword = password == null || password.isBlank();
        if (required && blankPassword) {
            throw new ConflictException(messageSource.getMessage("user.password.notblank", null, locale));
        }
        if (!blankPassword && !password.equals(request.getRePassword())) {
            throw new ConflictException(messageSource.getMessage("user.repassword.message", null, locale));
        }
    }

    private Map<String, Object> userAuditSnapshot(User user) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", user.getId());
        snapshot.put("fullName", user.getFullName());
        snapshot.put("email", user.getEmail());
        snapshot.put("phone", user.getPhone());
        snapshot.put("roleName", user.getRole() == null ? null : user.getRole().getRoleName());
        snapshot.put("accountStatus", user.getAccountStatus() == null ? null : user.getAccountStatus().name());
        snapshot.put("workStatus", user.getWorkStatus() == null ? null : user.getWorkStatus().name());
        snapshot.put("enabled", user.getEnabled());
        snapshot.put("permissions", user.getCustomPermissions() == null
                ? List.of()
                : user.getCustomPermissions().stream().map(Permission::getName).sorted().toList());
        return snapshot;
    }
}
