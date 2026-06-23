package com.hms.service.email;

public interface EmailService {
    void sendForgotPasswordMail(
            String to,
            String token
    );
    void sendActiveUserMail(
            String to,
            String fullName,
            String otpCode
    );
    void sendForgotPasswordOtpMail(
            String email,
            String fullName,
            String otpCode
    );

    void sendRegistrationOtp(String email, String otp);
}
