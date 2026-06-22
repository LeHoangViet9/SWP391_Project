package com.hms.service.auth.impl;

import com.hms.common.config.JwtTokenProvider;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;
import com.hms.common.enums.AccountStatus;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ForbiddenException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.exception.UnauthorizedException;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.auth.IUserService;
import com.hms.service.auth.mapper.UserMapper;
import com.hms.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements IUserService {


    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MessageSource messageSource;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final PageableUtils pageableUtils;


    @Override
    public Page<UserResponse> getUsers(
            String keywords,
            AccountStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
            ) {

        String normalizedKeywords = keywords == null ? "" : keywords.trim();
        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        return userRepository.searchUsers(normalizedKeywords, status, pageable)
                .map(user -> userMapper.toResponse(user, null));
    }

    @Override
    @Transactional
    public UserResponse createUser(UserManagementRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        validatePasswordForManagement(request, true, locale);

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
