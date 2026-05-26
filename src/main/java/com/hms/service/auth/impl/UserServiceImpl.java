package com.hms.service.auth.impl;

import com.hms.config.JwtTokenProvider;
import com.hms.dto.register.UserLoginRequest;
import com.hms.dto.register.UserRegisterRequest;
import com.hms.dto.response.UserResponse;
import com.hms.enums.AccountStatus;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.auth.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class UserServiceImpl implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MessageSource messageSource;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public UserResponse registerNewUser(UserRegisterRequest registerRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        if(userRepository.existsUserByUserName(registerRequest.getUsername())) {
            throw new RuntimeException(messageSource.getMessage("error.username.exists", null, locale));
        }
        if(userRepository.existsUserByEmail(registerRequest.getEmail())) {
            throw new RuntimeException(messageSource.getMessage("error.email.exists", null, locale));
        }
        if(userRepository.existsUserByPhone(registerRequest.getPhone())) {
            throw new RuntimeException(messageSource.getMessage("error.phone.exists", null, locale));
        }

        String defaultRole = "CUSTOMER";
        Role role = roleRepository.findByRoleName(defaultRole)
                .orElseThrow(() -> new RuntimeException(
                        messageSource.getMessage("error.role.invalid", new Object[]{defaultRole}, locale)
                ));

        User user = User.builder()
                .userName(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .fullName(registerRequest.getFullName())
                .phone(registerRequest.getPhone())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .accountStatus(AccountStatus.ACTIVE)
                .role(role)
                .build();
        User savedUser = userRepository.save(user);

        return toUserResponse(savedUser, null);
    }

    @Override
    @Transactional
    public UserResponse login(UserLoginRequest loginRequest) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findUserByUserName(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.login.failed", null, locale)));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException(messageSource.getMessage("error.login.failed", null, locale));
        }

        validateAccountStatus(user, locale);

        user.setLastLoginAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateToken(
                updatedUser.getUserName(),
                updatedUser.getRole().getRoleName()
        );

        return toUserResponse(updatedUser, accessToken);
    }

    private void validateAccountStatus(User user, Locale locale) {
        AccountStatus status = user.getAccountStatus();
        if (status == AccountStatus.BANNED) {
            throw new RuntimeException(messageSource.getMessage("error.account.banned", null, locale));
        }
        if (status == AccountStatus.INACTIVE) {
            throw new RuntimeException(messageSource.getMessage("error.account.inactive", null, locale));
        }
    }

    private UserResponse toUserResponse(User user, String token) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getUserName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                token,
                user.getAccountStatus().name(),
                user.getLastLoginAt()
        );
    }
}