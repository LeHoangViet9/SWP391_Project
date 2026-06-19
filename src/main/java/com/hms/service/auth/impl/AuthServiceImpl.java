package com.hms.service.auth.impl;

import com.hms.common.config.JwtTokenProvider;
import com.hms.common.enums.AccountStatus;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ForbiddenException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.exception.UnauthorizedException;
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
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
@Service
@Transactional
@RequiredArgsConstructor
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

        // 🌟 1. Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        User user = userMapper.toEntityRegister(registerRequest);
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);

        // 🌟 2. Gán các trường bảo mật kích hoạt
        user.setEnabled(false); // Mặc định khóa cho đến khi xác thực OTP thành công
        user.setOtpCode(otp);
        user.setOtpExpiration(LocalDateTime.now().plusMinutes(5)); // Hết hạn sau 5 phút

        User savedUser = userRepository.save(user);

        // 🌟 3. Gọi dịch vụ Email đa ngôn ngữ tự động gửi OTP đi
        try {
            emailService.sendActiveUserMail(savedUser.getEmail(), savedUser.getFullName(), otp);
        } catch (Exception e) {
            // Đăng ký thành công nhưng lỗi hạ tầng SMTP không được làm roll-back dữ liệu, khuyên khích ném cảnh báo
            throw new ConflictException("Đăng ký thành công nhưng hệ thống gửi Mail kích hoạt gặp sự cố!");
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

        if (!user.getEnabled()) {
            throw new ForbiddenException("Tài khoản chưa được kích hoạt! Vui lòng xác thực OTP trong Email.");
        }

        validateAccountStatus(user, locale);

        user.setLastLoginAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateToken(
                updatedUser.getEmail(),
                updatedUser.getRole().getRoleName()
        );

        return userMapper.toResponse(updatedUser, accessToken);
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

        // 1. Tìm user theo Email truyền lên
        User user = userRepository.findUserByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.email.invalid", null, locale)));

        // 2. Tạo mã OTP quên mật khẩu gồm 6 chữ số ngẫu nhiên
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        // 3. Lưu OTP vào trường resetPasswordToken
        user.setResetPasswordToken(otp);
        user.setResetPasswordExpiredAt(LocalDateTime.now().plusMinutes(5)); // Hiệu lực 5 phút
        userRepository.save(user);

        // 4. Bắn mail OTP khôi phục mật khẩu tự động bằng biến dịch đa ngôn ngữ
        emailService.sendForgotPasswordOtpMail(user.getEmail(), user.getFullName(), otp);
    }

    @Transactional
    @Override
    public void resetPassword(ResetPasswordRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        // 1. Kiểm tra xem Mật khẩu mới và Mật khẩu xác nhận có khớp nhau không
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ConflictException(messageSource.getMessage("user.repassword.message", null, locale));
        }

        // 2. Tìm user dựa vào mã OTP truyền lên từ màn hình Forgot (request.getToken() lúc này chứa OTP gồm 6 số)
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.forgot.otp.invalid", null, locale)));

        // 3. Kiểm tra thời hạn hiệu lực của OTP quên mật khẩu
        if (user.getResetPasswordExpiredAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException(messageSource.getMessage("error.forgot.otp.expired", null, locale));
        }

        // 4. Kiểm tra xem mật khẩu mới có bị trùng với mật khẩu cũ hay không
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ConflictException(messageSource.getMessage("error.password.invalid", null, locale));
        }

        // 5. Cập nhật mật khẩu mới đã mã hóa và làm sạch bộ nhớ đệm OTP
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiredAt(null);

        userRepository.save(user);
    }

    @Transactional
    @Override
    public void activeUser(String email, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();


        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.email.invalid", null, locale)));

        if (user.getEnabled()) {
            throw new ConflictException(messageSource.getMessage("error.account.already.active", null, locale));
        }


        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            throw new UnauthorizedException(messageSource.getMessage("error.otp.invalid", null, locale));
        }

        if (user.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException(messageSource.getMessage("error.otp.expired", null, locale));
        }

        // Kích hoạt tài khoản và xóa sạch vết OTP cũ
        user.setEnabled(true);
        user.setOtpCode(null);
        user.setOtpExpiration(null);

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
