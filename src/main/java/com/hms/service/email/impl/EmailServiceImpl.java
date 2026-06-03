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
}
