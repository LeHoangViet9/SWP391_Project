package com.hms.service.email.impl;


import com.hms.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final MessageSource messageSource;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendForgotPasswordMail(String to, String token) {
        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        Locale locale = LocaleContextHolder.getLocale();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(messageSource.getMessage("reset.password", null, locale));
            String body = messageSource.getMessage("link.reset.password", null, locale);
            message.setText(body + "\n" + resetLink);

            mailSender.send(message);
            log.info("[Email] Sent forgot-password mail to: {}", to);
        } catch (Exception e) {
            log.error("[Email] FAILED to send forgot-password mail to: {} — {}", to, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public void sendRegistrationOtp(String to, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(messageSource.getMessage("otp.registration.subject", null, locale));
            // Dùng {0} trong messages.properties — Spring MessageSource dùng MessageFormat
            String body = messageSource.getMessage("otp.registration.body", new Object[]{otpCode}, locale);
            message.setText(body);

            mailSender.send(message);
            log.info("[Email] Sent OTP {} to: {}", otpCode, to);
        } catch (Exception e) {
            log.error("[Email] FAILED to send OTP mail to: {} — {}", to, e.getMessage(), e);
            throw e;
        }
    }
}
