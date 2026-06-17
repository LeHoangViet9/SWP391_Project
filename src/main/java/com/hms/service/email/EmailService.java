package com.hms.service.email;

public interface EmailService {
    void sendForgotPasswordMail(
            String to,
            String token
    );

    void sendRegistrationOtp(
            String to,
            String otpCode
    );
}
