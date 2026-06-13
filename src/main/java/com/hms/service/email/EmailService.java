package com.hms.service.email;

public interface EmailService {
    void sendOtpMail(String to, String otp, String subjectKey, String bodyKey);
}
