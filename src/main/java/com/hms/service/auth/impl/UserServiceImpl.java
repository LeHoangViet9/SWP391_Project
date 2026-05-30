package com.hms.service.auth.impl;

import com.hms.config.JwtTokenProvider;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {


    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MessageSource messageSource;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final EmailService emailService;

    @Override
    public UserResponse registerNewUser(UserRegisterRequest registerRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        if(userRepository.existsUserByUserName(registerRequest.getUserName())) {
            throw new ConflictException(messageSource.getMessage("error.username.exists", null, locale));
        }
        if(userRepository.existsUserByEmail(registerRequest.getEmail())) {
            throw new ConflictException(messageSource.getMessage("error.email.exists", null, locale));
        }
        if(userRepository.existsUserByPhone(registerRequest.getPhone())) {
            throw new ConflictException(messageSource.getMessage("error.phone.exists", null, locale));
        }

        String defaultRole = "CUSTOMER";
        Role role = roleRepository.findByRoleName(defaultRole)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.role.invalid", new Object[]{defaultRole}, locale)
                ));

        User user = userMapper.toEntityRegister(registerRequest);
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        return userMapper.toResponse(savedUser,null);
    }

    @Override
    @Transactional
    public UserResponse login(UserLoginRequest loginRequest) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findUserByUserName(loginRequest.getUsername())
                .orElseThrow(() -> new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale)));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale));
        }

        validateAccountStatus(user, locale);

        user.setLastLoginAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateToken(
                updatedUser.getUserName(),
                updatedUser.getRole().getRoleName()
        );

        return userMapper.toResponse(updatedUser,accessToken);
    }

    @Override
    public void changePassword(String userName, ChangePasswordRequest changePasswordRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        User user=userRepository.findUserByUserName(userName).orElseThrow(()-> new ResourceNotFoundException("error.user.invalid"));
        if(!passwordEncoder.matches(changePasswordRequest.getOldPassword(), user.getPassword())) {
            throw new UnauthorizedException(messageSource.getMessage("error.password.invalid", null, locale));
        }
        if(passwordEncoder.matches(changePasswordRequest.getNewPassword(), user.getPassword())) {
            throw new ConflictException(messageSource.getMessage("error.password.invalid", null, locale));
        }

        user.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByEmail(request.getEmail()).orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.email.invalid", null, locale)));
        String token= UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordExpiredAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);
        emailService.sendForgotPasswordMail(user.getPassword(),  token);

    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
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
        if (status == AccountStatus.BANNED) {
            throw new ForbiddenException(messageSource.getMessage("error.account.banned", null, locale));
        }
        if (status == AccountStatus.INACTIVE) {
            throw new ForbiddenException(messageSource.getMessage("error.account.inactive", null, locale));
        }
    }
}