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

    /**
     * Gửi email thông báo khi có task dọn phòng mới được gán cho housekeeper.
     */
    void sendTaskAssignmentNotification(
            String toEmail,
            String housekeeperName,
            String roomNumber,
            String notes
    );
}
