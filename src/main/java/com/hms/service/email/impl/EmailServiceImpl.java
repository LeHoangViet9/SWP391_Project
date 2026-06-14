package com.hms.service.email.impl;


import com.hms.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;
    private final MessageSource messageSource;
    @Override
    public void sendForgotPasswordMail(String to, String token) {
        String resetLink =
                "http://localhost:3000/reset-password?token=" + token;

        Locale locale = LocaleContextHolder.getLocale();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);

        String subject = messageSource.getMessage("reset.password", null, locale);
        message.setSubject(subject);

        String bodyText = messageSource.getMessage("link.reset.password", null, locale);
        message.setText(bodyText + "\n" + resetLink);

        mailSender.send(message);
    }

    @Override
    public void sendActiveUserMail(String to, String fullName, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);

        // Lấy subject từ file properties
        String subject = messageSource.getMessage("register.subject", null, "Mã xác thực tài khoản mới", locale);
        message.setSubject(subject);

        // Truyền tham số fullName và otpCode vào các vị trí {0} và {1} trong file properties
        String body = messageSource.getMessage("register.body", new Object[]{fullName, otpCode}, locale);
        message.setText(body);

        mailSender.send(message);
    }

    @Override
    public void sendForgotPasswordOtpMail(String to, String fullName, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);

        // 1. Lấy tiêu đề mail quên mật khẩu
        String subject = messageSource.getMessage("forgot.password.subject", null, "Yêu cầu khôi phục mật khẩu", locale);
        message.setSubject(subject);

        // 2. Định nghĩa mảng biến động: {0} = fullName, {1} = otpCode, {2} = 5 (phút)
        Object[] messageParams = new Object[]{fullName, otpCode, 5};

        // 3. Nạp dữ liệu vào nội dung Mail
        String bodyText = messageSource.getMessage("forgot.password.body", messageParams, locale);
        message.setText(bodyText);

        mailSender.send(message);
    }
}
