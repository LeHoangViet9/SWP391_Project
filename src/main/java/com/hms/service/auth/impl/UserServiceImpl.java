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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements IUserService {


    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MessageSource messageSource;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final EmailService emailService;
    private final PageableUtils pageableUtils;


    @Transactional
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

        User user = userRepository.findUserByUserName(loginRequest.getUsername())
                .or(() -> userRepository.findUserByEmail(loginRequest.getUsername()))
                .orElseThrow(() -> new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale)));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new UnauthorizedException(messageSource.getMessage("error.login.failed", null, locale));
        }

        if (!user.isEnabled()) {
            throw new ForbiddenException("Tài khoản chưa được kích hoạt! Vui lòng xác thực OTP trong Email.");
        }

        validateAccountStatus(user, locale);

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
    public UserResponse getCurrentUser(String userName) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));
        return userMapper.toResponse(user, null);
    }

    @Transactional
    @Override
    public void changePassword(String userName, ChangePasswordRequest changePasswordRequest) {
        Locale locale = LocaleContextHolder.getLocale();
        User user = userRepository.findUserByUserName(userName)
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

    private void validateAccountStatus(User user, Locale locale) {
        AccountStatus status = user.getAccountStatus();
        if (status == AccountStatus.BANNED) {
            throw new ForbiddenException(messageSource.getMessage("error.account.banned", null, locale));
        }
        if (status == AccountStatus.INACTIVE) {
            throw new ForbiddenException(messageSource.getMessage("error.account.inactive", null, locale));
        }
    }

    @Override
    public Page<UserResponse> getUsers(
            Long id,
            String fullName,
            String userName,
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
        if (org.springframework.util.StringUtils.hasText(userName)) {
            String cleanUser = userName.trim().toLowerCase();
            stream = stream.filter(u -> u.getUserName() != null && u.getUserName().toLowerCase().contains(cleanUser));
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
        extractors.put("username", User::getUserName);
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

        if (userRepository.existsUserByUserName(request.getUserName())) {
            throw new ConflictException(messageSource.getMessage("error.username.exists", null, locale));
        }
        if (userRepository.existsUserByEmail(request.getEmail())) {
            throw new ConflictException(messageSource.getMessage("error.email.exists", null, locale));
        }
        if (userRepository.existsUserByPhone(request.getPhone())) {
            throw new ConflictException(messageSource.getMessage("error.phone.exists", null, locale));
        }

        Role role = findRole(request.getRoleName(), locale);
        User user = User.builder()
                .userName(request.getUserName())
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

        if (!user.getUserName().equals(request.getUserName())
                && userRepository.existsByUserNameAndIdNot(request.getUserName(), id)) {
            throw new ConflictException(messageSource.getMessage("error.username.exists", null, locale));
        }
        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new ConflictException(messageSource.getMessage("error.email.exists", null, locale));
        }
        if (!user.getPhone().equals(request.getPhone())
                && userRepository.existsByPhoneAndIdNot(request.getPhone(), id)) {
            throw new ConflictException(messageSource.getMessage("error.phone.exists", null, locale));
        }

        user.setUserName(request.getUserName());
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

    @Transactional
    @Override
    public void activeUser(String email, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();


        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.email.invalid", null, locale)));

        if (user.isEnabled()) {
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
