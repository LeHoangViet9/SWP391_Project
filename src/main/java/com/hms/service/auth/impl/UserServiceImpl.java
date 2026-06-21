package com.hms.service.auth.impl;

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
<<<<<<< HEAD
=======
import com.hms.entity.auth.Permission;
>>>>>>> e040e79 (update login)
import com.hms.repository.auth.PermissionRepository;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.auth.IUserService;
import com.hms.service.auth.mapper.UserMapper;
<<<<<<< HEAD
=======
import com.hms.service.email.EmailService;
import java.util.ArrayList;
import java.util.List;
>>>>>>> e040e79 (update login)
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
<<<<<<< HEAD
=======
import org.springframework.util.StringUtils;
>>>>>>> e040e79 (update login)

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class UserServiceImpl implements IUserService {

    private static final String ERROR_EMAIL_EXISTS = "error.email.exists";
    private static final String ERROR_PHONE_EXISTS = "error.phone.exists";
    private static final String ERROR_USER_INVALID = "error.user.invalid";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
<<<<<<< HEAD
=======
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final MessageSource messageSource;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
>>>>>>> e040e79 (update login)
    private final UserMapper userMapper;
    private final PageableUtils pageableUtils;
<<<<<<< HEAD
    private final PasswordEncoder passwordEncoder;
    private final MessageSource messageSource;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
=======

    @Transactional
    @Override
    public UserResponse registerNewUser(UserRegisterRequest registerRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        if(userRepository.existsUserByEmail(registerRequest.getEmail())) {
            throw new ConflictException(messageSource.getMessage(ERROR_EMAIL_EXISTS, null, locale));
        }
        if(userRepository.existsUserByPhone(registerRequest.getPhone())) {
            throw new ConflictException(messageSource.getMessage(ERROR_PHONE_EXISTS, null, locale));
        }

        String defaultRole = "CUSTOMER";
        Role role = roleRepository.findByRoleNameIgnoreCase(defaultRole)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.invalid", new Object[]{defaultRole}, locale)
                ));

        User user = userMapper.toEntityRegister(registerRequest);
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);
        user.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        // [FIX-1 & FIX-2] Use SecureRandom + store OTP as Bcrypt hash
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        user.setOtpCode(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        User savedUser = userRepository.save(user);

        // Send email AFTER saving successfully
        // If email fails -> user is created -> can use resend-otp
        try {
            emailService.sendRegistrationOtp(savedUser.getEmail(), otp);
        } catch (Exception e) {
            log.warn("[WARN] Failed to send OTP email to {} : {}", savedUser.getEmail(), e.getMessage());
        }

        return userMapper.toResponse(savedUser, null);
    }

    @Override
    @Transactional(noRollbackFor = UnauthorizedException.class)
    public UserResponse login(UserLoginRequest loginRequest) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findUserByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale)));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale));
        }

        validateAccountStatus(user, locale);

        // Generate and send login OTP code
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        user.setOtpCode(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        try {
            emailService.sendRegistrationOtp(user.getEmail(), otp);
        } catch (Exception e) {
            log.warn("[WARN] Failed to send login OTP email to {}: {}", user.getEmail(), e.getMessage());
        }

        // Throw custom exception with errorCode "LOGIN_OTP_REQUIRED" to signal frontend to verify OTP
        throw new UnauthorizedException(
            messageSource.getMessage("auth.otp.required", null, "OTP verification required", locale),
            "LOGIN_OTP_REQUIRED"
        );
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage(ERROR_USER_INVALID, null, locale)));
        return userMapper.toResponse(user, null);
    }

    @Transactional
    @Override
    public void changePassword(String email, ChangePasswordRequest changePasswordRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage(ERROR_USER_INVALID, null, locale)));
        if (!passwordEncoder.matches(changePasswordRequest.getOldPassword(), user.getPassword())) {
            throw new UnauthorizedException(messageSource.getMessage("error.password.incorrect", null, locale));
        }
        if (passwordEncoder.matches(changePasswordRequest.getNewPassword(), user.getPassword())) {
            throw new ConflictException(messageSource.getMessage("error.password.sameAsOld", null, locale));
        }

        user.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
        userRepository.save(user);
    }
    @Transactional
    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.email.invalid", null, locale)));
        String token = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        user.setResetPasswordToken(token);
        user.setResetPasswordExpiredAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // [FIX-8] Wrap email in try/catch — similar to registerNewUser/resendOtp
        // If email fails -> token is still saved -> user can request again
        try {
            emailService.sendForgotPasswordMail(user.getEmail(), token);
        } catch (Exception e) {
            log.warn("[WARN] Failed to send forgot-password email to {}: {}", user.getEmail(), e.getMessage());
        }
    }
    @Transactional
    @Override
    public void resetPassword(ResetPasswordRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ConflictException(messageSource.getMessage("user.repassword.message", null, locale));
        }
        User user=userRepository.findByResetPasswordToken(request.getToken()).orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.token.invalid", null, locale)));
        if(user.getResetPasswordExpiredAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException(messageSource.getMessage("error.token.expired", null, locale));
        }
        if(passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ConflictException(messageSource.getMessage("error.password.invalid", null, locale));
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiredAt(null);
        userRepository.save(user);
    }

    private void validateAccountStatus(User user, Locale locale) {
        AccountStatus status = user.getAccountStatus();
        if (status == AccountStatus.PENDING_VERIFICATION) {
            throw new UnauthorizedException(messageSource.getMessage("error.account.pending", null, locale), "ACCOUNT_PENDING");
        }
        if (status == AccountStatus.BANNED) {
            throw new ForbiddenException(messageSource.getMessage("error.account.banned", null, locale));
        }
        if (status == AccountStatus.INACTIVE) {
            throw new ForbiddenException(messageSource.getMessage("error.account.inactive", null, locale));
        }
    }

    @Transactional
    @Override
    public UserResponse verifyOtp(VerifyOtpRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage(ERROR_USER_INVALID, null, locale)));

        // Check expiration FIRST to return the correct message to the user
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException(messageSource.getMessage("error.otp.expired", null, locale));
        }

        // [FIX-2] OTP is stored as Bcrypt hash -> use matches() for comparison
        if (user.getOtpCode() == null || !passwordEncoder.matches(request.getOtpCode(), user.getOtpCode())) {
            throw new UnauthorizedException(messageSource.getMessage("error.otp.invalid", null, locale));
        }

        if (user.getAccountStatus() == AccountStatus.PENDING_VERIFICATION) {
            user.setAccountStatus(AccountStatus.ACTIVE);
        }
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setLastLoginAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateToken(
                savedUser.getEmail(),
                savedUser.getRole().getRoleName()
        );

        return userMapper.toResponse(savedUser, accessToken);
    }

    @Transactional
    @Override
    public void resendOtp(String email) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage(ERROR_USER_INVALID, null, locale)));

        validateAccountStatus(user, locale);

        // [FIX-1] Use SecureRandom instead of standard Random
        // [FIX-2] Store OTP as Bcrypt hash
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        user.setOtpCode(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // [FIX-4] If email fails to send -> do not crash, only log warning
        try {
            emailService.sendRegistrationOtp(user.getEmail(), otp);
        } catch (Exception e) {
            log.warn("[WARN] Failed to resend OTP email to {} : {}", user.getEmail(), e.getMessage());
        }
    }
>>>>>>> e040e79 (update login)

    @Override
    public Page<UserResponse> getUsers(
            Long id, String fullName, String email, String phone, String roleName, AccountStatus status,
            Integer page, Integer size, SortField sortBy, SortDirection direction) {
        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        Page<User> userPage = userRepository.searchUsers(id, fullName , email ,phone, roleName , status,pageable);
        return userPage.map(user -> userMapper.toResponse(user, null));
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
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));

        validatePasswordForManagement(request, false, locale);

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
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
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
        user.setCustomPermissions(new HashSet<>(permissions));

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

    @Override
    @Transactional
    public UserResponse assignPermissionsToUser(Long userId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        List<Permission> currentCustom = user.getCustomPermissions();
        if (currentCustom == null) {
            currentCustom = new ArrayList<>();
            user.setCustomPermissions(currentCustom);
        }
        for (Permission perm : permissions) {
            if (!currentCustom.contains(perm)) {
                currentCustom.add(perm);
            }
        }

        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser, null);
    }

    @Override
    @Transactional
    public UserResponse removePermissionsFromUser(Long userId, List<Long> permissionIds) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_USER_INVALID, null, locale)
                ));

        List<Permission> permissionsToRemove = permissionRepository.findAllById(permissionIds);
        List<Permission> currentCustom = user.getCustomPermissions();
        if (currentCustom != null) {
            currentCustom.removeAll(permissionsToRemove);
        }

        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser, null);
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
}
