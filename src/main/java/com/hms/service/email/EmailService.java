package com.hms.service.email;

public interface EmailService {
    void sendForgotPasswordMail(
            String to,
            String token
    );

    // Thêm hàm này vào interface của bạn
    void sendActiveUserMail(String to, String fullName, String otpCode);

    void sendForgotPasswordOtpMail(String to, String fullName, String otpCode);
}
