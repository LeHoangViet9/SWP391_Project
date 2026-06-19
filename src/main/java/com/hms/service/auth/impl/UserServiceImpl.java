package com.hms.service.auth.impl;

import com.hms.common.config.JwtTokenProvider;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.*;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;
import com.hms.common.enums.AccountStatus;
import com.hms.entity.auth.Permission;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import com.hms.repository.auth.PermissionRepository;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.auth.IUserService;
import com.hms.service.auth.mapper.UserMapper;
import com.hms.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class UserServiceImpl implements IUserService {


    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PageableUtils pageableUtils;
    private final PasswordEncoder passwordEncoder;
    private final MessageSource messageSource;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public Page<UserResponse> getUsers(
            Long id,
            String fullName,
            String email,
            String phone,
            String roleName,
            AccountStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        java.util.List<User> list = userRepository.findAll();
        java.util.stream.Stream<User> stream = list.stream();

        if (id != null) {
            stream = stream.filter(u -> u.getId().equals(id));
        }
        if (org.springframework.util.StringUtils.hasText(fullName)) {
            String cleanName = fullName.trim().toLowerCase();
            stream = stream.filter(u -> u.getFullName() != null && u.getFullName().toLowerCase().contains(cleanName));
        }
        if (org.springframework.util.StringUtils.hasText(email)) {
            String cleanEmail = email.trim().toLowerCase();
            stream = stream.filter(u -> u.getEmail() != null && u.getEmail().toLowerCase().contains(cleanEmail));
        }
        if (org.springframework.util.StringUtils.hasText(phone)) {
            String cleanPhone = phone.trim().toLowerCase();
            stream = stream.filter(u -> u.getPhone() != null && u.getPhone().toLowerCase().contains(cleanPhone));
        }
        if (org.springframework.util.StringUtils.hasText(roleName)) {
            String cleanRole = roleName.trim().toLowerCase();
            stream = stream.filter(u -> u.getRole() != null && u.getRole().getRoleName() != null && u.getRole().getRoleName().toLowerCase().contains(cleanRole));
        }
        if (status != null) {
            stream = stream.filter(u -> u.getAccountStatus() == status);
        }

        java.util.List<User> filteredList = stream.collect(java.util.stream.Collectors.toList());

        // Sorting
        java.util.Map<String, java.util.function.Function<User, Comparable<?>>> extractors = new java.util.HashMap<>();
        extractors.put("id", User::getId);
        extractors.put("fullName", User::getFullName);
        extractors.put("email", User::getEmail);
        extractors.put("phone", User::getPhone);
        extractors.put("roleName", u -> u.getRole() != null ? u.getRole().getRoleName() : "");
        extractors.put("accountStatus", u -> u.getAccountStatus() != null ? u.getAccountStatus().name() : "");

        pageableUtils.sortList(filteredList, sortBy, direction, extractors);

        // Pagination
        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        return pageableUtils.paginate(filteredList, pageable)
                .map(user -> userMapper.toResponse(user, null));
    }

    @Override
    @Transactional
    public UserResponse createUser(UserManagementRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        validatePasswordForManagement(request, true, locale);

        if ("CUSTOMER".equalsIgnoreCase(request.getRoleName())) {
            throw new ForbiddenException(messageSource.getMessage("error.user.create.customer.disabled", null, locale));
        }

        if (userRepository.existsUserByEmail(request.getEmail())) {
            throw new ConflictException(messageSource.getMessage("error.email.exists", null, locale));
        }
        if (userRepository.existsUserByPhone(request.getPhone())) {
            throw new ConflictException(messageSource.getMessage("error.phone.exists", null, locale));
        }

        Role role = findRole(request.getRoleName(), locale);
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .accountStatus(request.getAccountStatus() == null ? AccountStatus.ACTIVE : request.getAccountStatus())
                .role(role)
                .build();

        return userMapper.toResponse(userRepository.save(user), null);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserManagementRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.invalid", null, locale)
                ));

        validatePasswordForManagement(request, false, locale);

        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new ConflictException(messageSource.getMessage("error.email.exists", null, locale));
        }
        if (!user.getPhone().equals(request.getPhone())
                && userRepository.existsByPhoneAndIdNot(request.getPhone(), id)) {
            throw new ConflictException(messageSource.getMessage("error.phone.exists", null, locale));
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRole(findRole(request.getRoleName(), locale));
        user.setAccountStatus(request.getAccountStatus() == null ? AccountStatus.ACTIVE : request.getAccountStatus());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userMapper.toResponse(userRepository.save(user), null);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.invalid", null, locale)
                ));
        user.setAccountStatus(AccountStatus.INACTIVE);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public UserResponse assignPermissionsToUser(Long userId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.invalid", null, locale)
                ));

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);

        if (permissions.isEmpty()) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage("error.permission.notfound", null, locale)
            );
        }

        // Gán quyền mới (ghi đè)
        user.setCustomPermissions(permissions);

        return userMapper.toResponse(userRepository.save(user), null);
    }

    // ✅ THÊM MỚI: Xóa quyền riêng khỏi user
    @Override
    @Transactional
    public UserResponse removePermissionsFromUser(Long userId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.invalid", null, locale)
                ));

        if (user.getCustomPermissions() != null) {
            user.getCustomPermissions().removeIf(p -> permissionIds.contains(p.getId()));
        }

        return userMapper.toResponse(userRepository.save(user), null);
    }

    // ✅ THÊM MỚI: Xem tất cả quyền của user
    @Override
    public UserResponse getUserPermissions(Long userId) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.invalid", null, locale)
                ));

        return userMapper.toResponse(user, null);
    }

    private Role findRole(String roleName, Locale locale) {
        return roleRepository.findByRoleNameIgnoreCase(roleName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.invalid", new Object[]{roleName}, locale)
                ));
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
}
