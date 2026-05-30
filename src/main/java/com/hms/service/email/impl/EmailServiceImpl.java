package com.hms.service.email.impl;


import com.hms.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;
    @Override
    public void sendForgotPasswordMail(String to, String token) {
        String resetLink =
                "http://localhost:3000/reset-password?token=" + token;

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setTo(to);

        message.setSubject("Reset Password");

        message.setText(
                "Click link to reset password:\n"
                        + resetLink
        );

        mailSender.send(message);
    }
}
