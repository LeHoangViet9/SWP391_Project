package com.hms.service.auth.impl;

import com.hms.common.config.JwtTokenProvider;
import com.hms.common.enums.AccountStatus;
import com.hms.common.exception.*;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.auth.request.*;
import com.hms.dto.auth.response.UserResponse;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.auth.IAuthService;
import com.hms.service.auth.mapper.UserMapper;
import com.hms.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements IAuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MessageSource messageSource;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final EmailService emailService;

    @Transactional
    @Override
    public UserResponse registerNewUser(UserRegisterRequest registerRequest) {
        Locale locale = LocaleContextHolder.getLocale();
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
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);
        user.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        User savedUser = userRepository.save(user);

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

        User user = userRepository.findUserByEmail(loginRequest.getEmail())
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

        return userMapper.toResponse(updatedUser,accessToken);
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));
        return userMapper.toResponse(user, null);
    }

    @Transactional
    @Override
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
        userRepository.save(user);
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

        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendRegistrationOtp(user.getEmail(), otp);
    }
}
