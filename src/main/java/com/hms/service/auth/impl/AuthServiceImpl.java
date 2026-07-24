package com.hms.service.auth.impl;

import com.hms.common.config.JwtTokenProvider;
import com.hms.common.enums.AccountStatus;
import com.hms.common.exception.*;
import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import com.hms.entity.customer.Customer;
import com.hms.common.enums.IdType;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.service.auth.AuthService;
import com.hms.service.auth.mapper.UserMapper;
import com.hms.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hms.common.audit.Auditable;
import com.hms.service.audit.AuditLogService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final MessageSource messageSource;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Transactional
    @Override
    @Auditable(action = "CREATE_USER", module = "USER", logSuccess = false)
    public UserResponse registerNewUser(UserRegisterRequest registerRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        if (registerRequest.getEmail() != null) {
            registerRequest.setEmail(registerRequest.getEmail().trim().toLowerCase());
        }
        if(userRepository.existsUserByEmail(registerRequest.getEmail())) {
            throw new ConflictException(messageSource.getMessage("error.email.exists", null, locale));
        }
        if(userRepository.existsUserByPhone(registerRequest.getPhone())) {
            throw new ConflictException(messageSource.getMessage("error.phone.exists", null, locale));
        }

        String defaultRole = "CUSTOMER";
        Role role = roleRepository.findByRoleNameIgnoreCase(defaultRole)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.invalid", new Object[]{defaultRole}, locale)
                ));

        User user = userMapper.toEntityRegister(registerRequest);
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);
        user.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        User savedUser = userRepository.save(user);

        // Tạo bản ghi Customer tương ứng — tách biệt dữ liệu Khách hàng khỏi Nhân viên
        if (!customerRepository.existsByEmail(savedUser.getEmail())) {
            Customer customer = Customer.builder()
                    .fullName(savedUser.getFullName())
                    .email(savedUser.getEmail())
                    .phone(savedUser.getPhone())
                    .idType(IdType.CCCD)
                    .idNumberCard("PENDING_" + savedUser.getId())
                    .nationality("Vietnam")
                    .status(AccountStatus.ACTIVE)
                    .build();
            customerRepository.save(customer);
            log.info("[REGISTER] Created Customer record for email={}", savedUser.getEmail());
        }

        // Gửi email SAU KHI save thành công
        // Nếu email lỗi → user đã được tạo → có thể dùng resend-otp
        try {
            emailService.sendRegistrationOtp(savedUser.getEmail(), otp);
        } catch (Exception e) {
            log.warn("[WARN] Failed to send OTP email to {} : {}", savedUser.getEmail(), e.getMessage());
        }

        return userMapper.toResponse(savedUser, null);
    }

    @Override
    @Transactional
    public UserResponse login(UserLoginRequest loginRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        String normalizedEmail = loginRequest.getEmail() != null ? loginRequest.getEmail().trim().toLowerCase() : "";

        try {
            User user = userRepository.findUserByEmail(normalizedEmail)
                    .orElseThrow(() -> new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale)));

            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                throw new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale));
            }

            validateAccountStatus(user, locale);

            user.setLastLoginAt(LocalDateTime.now());
            User updatedUser = userRepository.save(user);

            String accessToken = jwtTokenProvider.generateToken(
                    updatedUser.getEmail(),
                    updatedUser.getRole().getRoleName()
            );

            auditLogService.logSuccess(
                    "LOGIN_SUCCESS",
                    "AUTH",
                    "USER",
                    updatedUser.getId(),
                    updatedUser.getEmail(),
                    auditLogService.message(null, userAuditSnapshot(updatedUser))
            );

            return userMapper.toResponse(updatedUser,accessToken);
        } catch (RuntimeException e) {
            auditLogService.logFailure(
                    "LOGIN_FAILED",
                    "AUTH",
                    "USER",
                    null,
                    loginRequest.getEmail(),
                    loginAttemptChanges(loginRequest.getEmail()),
                    e
            );
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));
        return userMapper.toResponse(user, null);
    }

    @Transactional
    @Override
    @Auditable(action = "CHANGE_PASSWORD", module = "USER", logSuccess = false)
    public void changePassword(String email, ChangePasswordRequest changePasswordRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));
        if (!passwordEncoder.matches(changePasswordRequest.getOldPassword(), user.getPassword())) {
            throw new UnauthorizedException(messageSource.getMessage("error.password.incorrect", null, locale));
        }
        if (passwordEncoder.matches(changePasswordRequest.getNewPassword(), user.getPassword())) {
            throw new ConflictException(messageSource.getMessage("error.password.sameAsOld", null, locale));
        }

        user.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
        User updated = userRepository.save(user);
        auditLogService.logSuccess(
                "CHANGE_PASSWORD",
                "USER",
                "USER",
                updated.getId(),
                updated.getEmail(),
                auditLogService.message(null, Map.of("passwordChanged", true))
        );
    }
    @Transactional
    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(request.getEmail()).orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.email.invalid", null, locale)));
        String token =  UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordExpiredAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);
        emailService.sendForgotPasswordMail(user.getEmail(), token);

    }
    @Transactional
    @Override
    @Auditable(action = "RESET_PASSWORD", module = "USER", logSuccess = false)
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
        User updated = userRepository.save(user);
        auditLogService.logSuccess(
                "RESET_PASSWORD",
                "USER",
                "USER",
                updated.getId(),
                updated.getEmail(),
                auditLogService.message(null, Map.of("passwordReset", true))
        );
    }

    private void validateAccountStatus(User user, Locale locale) {
        AccountStatus status = user.getAccountStatus();
        if (status == AccountStatus.PENDING_VERIFICATION) {
            throw new UnauthorizedException(messageSource.getMessage("error.account.pending", null, locale));
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
    public void verifyOtp(VerifyOtpRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));

        if (user.getAccountStatus() != AccountStatus.PENDING_VERIFICATION) {
            throw new BadRequestException(messageSource.getMessage("error.otp.alreadyVerified", null, locale));
        }

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
            throw new UnauthorizedException(messageSource.getMessage("error.otp.invalid", null, locale));
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException(messageSource.getMessage("error.otp.expired", null, locale));
        }

        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    @Transactional
    @Override
    public void resendOtp(String email) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));

        if (user.getAccountStatus() != AccountStatus.PENDING_VERIFICATION) {
            throw new BadRequestException(messageSource.getMessage("error.otp.alreadyVerified", null, locale));
        }
        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendRegistrationOtp(user.getEmail(), otp);
    }



    private Map<String, Object> userAuditSnapshot(User user) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", user.getId());
        snapshot.put("fullName", user.getFullName());
        snapshot.put("email", user.getEmail());
        snapshot.put("phone", user.getPhone());
        snapshot.put("roleName", user.getRole() == null ? null : user.getRole().getRoleName());
        snapshot.put("accountStatus", user.getAccountStatus() == null ? null : user.getAccountStatus().name());
        snapshot.put("lastLoginAt", user.getLastLoginAt());
        return snapshot;
    }

    private Map<String, Object> loginAttemptChanges(String email) {
        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("email", email);
        return auditLogService.message(null, changes);
    }

//
//    private String generateOtp(int length){
//        StringBuilder otp = new StringBuilder();
//        for(char c='0';c<='9';c++){
//            otp.append(c);
//        }
//        for(char c='A';c<='Z';c++){
//            otp.append(c);
//        }
//        String finalChar=otp.toString();
//        SecureRandom random = new SecureRandom();
//        StringBuilder sb = new StringBuilder(length);
//        for(int i=0;i<length;i++){
//            sb.append(finalChar.charAt(random.nextInt(finalChar.length())));
//        }
//        return sb.toString();
//    }
}
