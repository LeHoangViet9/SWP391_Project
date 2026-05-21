package com.hms.service.impl;

import com.hms.config.JwtTokenProvider;
import com.hms.dto.register.UserLoginRequest;
import com.hms.dto.register.UserRegisterRequest;
import com.hms.dto.response.UserResponse;
import com.hms.model.Role;
import com.hms.model.User;
import com.hms.repository.RoleRepository;
import com.hms.repository.UserRepository;
import com.hms.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
        Role role = roleRepository.findById(defaultRole)
                .orElseThrow(() -> new RuntimeException(
                        messageSource.getMessage("error.role.invalid", new Object[]{defaultRole}, locale)
                ));

        User user = new User();
        user.setUserName(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setFullName(registerRequest.getFullName());
        user.setPhone(registerRequest.getPhone());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);
        User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getUserName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole().getRoleName(),
                null
        );
    }

    @Override
    public UserResponse login(UserLoginRequest loginRequest) {
        Locale locale = LocaleContextHolder.getLocale();

        User user = userRepository.findUserByUserName(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.login.failed", null, locale)));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException(messageSource.getMessage("error.login.failed", null, locale));
        }

        String accessToken = jwtTokenProvider.generateToken(user.getUserName(), user.getRole().getRoleName());

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getUserName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                accessToken
        );
    }
}