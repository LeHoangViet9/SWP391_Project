package com.hms.service.email.impl;


import com.hms.service.email.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(messageSource.getMessage("reset.password", null, locale));

            String htmlContent = buildForgotPasswordHtml(resetLink, locale);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("[Email] Sent forgot-password mail to: {}", to);
        } catch (MessagingException e) {
            log.error("[Email] FAILED to send forgot-password mail to: {} — {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    public void sendRegistrationOtp(String to, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(messageSource.getMessage("otp.registration.subject", null, locale));

            String htmlContent = buildOtpEmailHtml(otpCode, to, locale);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("[Email] Sent OTP {} to: {}", otpCode, to);
        } catch (MessagingException e) {
            log.error("[Email] FAILED to send OTP mail to: {} — {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Build branded HTML email for OTP verification
     */
    private String buildOtpEmailHtml(String otpCode, String email, Locale locale) {
        boolean isVi = "vi".equals(locale.getLanguage());

        // Split OTP into individual digit cells
        StringBuilder digitCells = new StringBuilder();
        for (char c : otpCode.toCharArray()) {
            digitCells.append(
                "<td style=\"width:44px;height:52px;text-align:center;font-size:26px;font-weight:700;" +
                "font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a2332;" +
                "border:2px solid #e7e5e4;border-radius:8px;background:#faf6ed;letter-spacing:0;\">" +
                c + "</td>"
            );
        }

        return "<!DOCTYPE html>" +
            "<html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">" +
            "</head><body style=\"margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;\">" +
            "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f5f4;padding:32px 0;\">" +
            "<tr><td align=\"center\">" +
            "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);\">" +

            // ── Header with brand ──
            "<tr><td style=\"background:linear-gradient(135deg,#0c192c 0%,#1a2332 100%);padding:32px 40px;text-align:center;\">" +
            "<table cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto;\"><tr>" +
            "<td style=\"width:40px;height:40px;background:#bfa15f;border-radius:8px;text-align:center;vertical-align:middle;\">" +
            "<span style=\"color:#ffffff;font-size:20px;font-weight:bold;\">♛</span></td>" +
            "<td style=\"padding-left:12px;\">" +
            "<p style=\"margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;\">HMS<span style=\"color:#bfa15f;\">Hotel</span></p>" +
            "<p style=\"margin:0;font-size:9px;color:#bfa15f;text-transform:uppercase;letter-spacing:3px;\">Hotel & Resort</p>" +
            "</td></tr></table>" +
            "</td></tr>" +

            // ── Body ──
            "<tr><td style=\"padding:40px;\">" +
            // Greeting
            "<p style=\"margin:0 0 8px;font-size:16px;color:#44403c;\">" +
            (isVi ? "Xin chào," : "Hello,") + "</p>" +
            "<h2 style=\"margin:0 0 24px;font-size:20px;font-weight:700;color:#1a2332;\">" +
            (isVi ? "Vui lòng xác thực tài khoản của bạn" : "Please verify your identity") + "</h2>" +

            // Description
            "<p style=\"margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.6;\">" +
            (isVi ? "Đây là mã xác thực đăng ký HMS Hotel của bạn:" : "Here is your HMS registration authentication code:") + "</p>" +

            // OTP Code Box
            "<table cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto 24px;border:1px solid #e7e5e4;border-radius:12px;padding:20px 24px;\">" +
            "<tr><td align=\"center\">" +
            "<table cellpadding=\"0\" cellspacing=\"6\"><tr>" + digitCells.toString() + "</tr></table>" +
            "</td></tr></table>" +

            // Validity notice
            "<p style=\"margin:0 0 8px;font-size:13px;color:#78716c;\">" +
            (isVi ? "Mã này có hiệu lực trong " : "This code is valid for ") +
            "<strong style=\"color:#1a2332;\">5 " + (isVi ? "phút" : "minutes") + "</strong>" +
            (isVi ? " và chỉ sử dụng được một lần." : " and can only be used once.") + "</p>" +

            // Security notice
            "<p style=\"margin:0 0 0;font-size:13px;color:#78716c;\">" +
            "<strong style=\"color:#1a2332;\">" + (isVi ? "Vui lòng không chia sẻ mã này:" : "Please don't share this code:") + "</strong> " +
            (isVi ? "chúng tôi sẽ không bao giờ hỏi bạn qua điện thoại hay email." : "we'll never ask for it on the phone or via email.") + "</p>" +

            // Signature
            "<p style=\"margin:24px 0 0;font-size:14px;color:#78716c;\">" +
            (isVi ? "Trân trọng," : "Thanks,") + "<br>" +
            "<strong style=\"color:#1a2332;\">The HMS Team</strong></p>" +

            "</td></tr>" +

            // ── Footer ──
            "<tr><td style=\"background:#fafaf9;padding:24px 40px;border-top:1px solid #e7e5e4;text-align:center;\">" +
            "<p style=\"margin:0 0 8px;font-size:11px;color:#a8a29e;line-height:1.5;\">" +
            (isVi
                ? "Bạn nhận được email này vì đã yêu cầu mã xác thực cho tài khoản HMS Hotel.<br>Nếu không phải bạn, vui lòng bỏ qua email này."
                : "You're receiving this email because a verification code was requested for your HMS account.<br>If this wasn't you, please ignore this email.") +
            "</p>" +
            "<p style=\"margin:0;font-size:10px;color:#d6d3d1;\">" +
            "HMS Hotel, Inc. • 98 Colin P Kelly Jr Street • San Francisco, CA 94107" +
            "</p></td></tr>" +

            "</table></td></tr></table></body></html>";
    }

    /**
     * Build branded HTML email for password reset
     */
    private String buildForgotPasswordHtml(String resetLink, Locale locale) {
        boolean isVi = "vi".equals(locale.getLanguage());

        return "<!DOCTYPE html>" +
            "<html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">" +
            "</head><body style=\"margin:0;padding:0;background:#f5f5f4;font-family:'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;\">" +
            "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f5f4;padding:32px 0;\">" +
            "<tr><td align=\"center\">" +
            "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);\">" +

            // ── Header ──
            "<tr><td style=\"background:linear-gradient(135deg,#0c192c 0%,#1a2332 100%);padding:32px 40px;text-align:center;\">" +
            "<table cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto;\"><tr>" +
            "<td style=\"width:40px;height:40px;background:#bfa15f;border-radius:8px;text-align:center;vertical-align:middle;\">" +
            "<span style=\"color:#ffffff;font-size:20px;font-weight:bold;\">♛</span></td>" +
            "<td style=\"padding-left:12px;\">" +
            "<p style=\"margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;\">HMS<span style=\"color:#bfa15f;\">Hotel</span></p>" +
            "<p style=\"margin:0;font-size:9px;color:#bfa15f;text-transform:uppercase;letter-spacing:3px;\">Hotel & Resort</p>" +
            "</td></tr></table>" +
            "</td></tr>" +

            // ── Body ──
            "<tr><td style=\"padding:40px;\">" +
            "<h2 style=\"margin:0 0 16px;font-size:20px;font-weight:700;color:#1a2332;\">" +
            (isVi ? "Đặt lại mật khẩu" : "Reset Your Password") + "</h2>" +
            "<p style=\"margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.6;\">" +
            (isVi ? "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản HMS Hotel của bạn. Nhấn vào nút bên dưới để tiếp tục:" : "We received a request to reset your HMS Hotel account password. Click the button below to continue:") + "</p>" +

            // CTA Button
            "<table cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto 24px;\"><tr>" +
            "<td style=\"background:#bfa15f;border-radius:8px;\">" +
            "<a href=\"" + resetLink + "\" style=\"display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;\">" +
            (isVi ? "ĐẶT LẠI MẬT KHẨU" : "RESET PASSWORD") + "</a>" +
            "</td></tr></table>" +

            "<p style=\"margin:0 0 0;font-size:13px;color:#a8a29e;\">" +
            (isVi ? "Liên kết này sẽ hết hạn sau 15 phút." : "This link will expire in 15 minutes.") + "</p>" +
            "</td></tr>" +

            // ── Footer ──
            "<tr><td style=\"background:#fafaf9;padding:24px 40px;border-top:1px solid #e7e5e4;text-align:center;\">" +
            "<p style=\"margin:0;font-size:10px;color:#d6d3d1;\">" +
            "HMS Hotel, Inc. • 98 Colin P Kelly Jr Street • San Francisco, CA 94107" +
            "</p></td></tr>" +

            "</table></td></tr></table></body></html>";
    }

    @Override
    public void sendActiveUserMail(String to, String fullName, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);

        String subject = messageSource.getMessage("active.account", null, locale);
        message.setSubject(subject);

        String bodyText = messageSource.getMessage("otp.code", new Object[]{fullName, otpCode}, locale);
        message.setText(bodyText);

        mailSender.send(message);
    }

    @Override
    public void sendForgotPasswordOtpMail(String email, String fullName, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);

        String subject = messageSource.getMessage("reset.password", null, locale);
        message.setSubject(subject);

        String bodyText = messageSource.getMessage("otp.code", new Object[]{fullName, otpCode}, locale);
        message.setText(bodyText);

        mailSender.send(message);
    }

    @Override
    public void sendTaskAssignmentNotification(String toEmail, String housekeeperName,
                                                String roomNumber, String notes) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🧹 New Housekeeping Task Assigned - Room " + roomNumber);

            String htmlContent = buildTaskAssignmentHtml(housekeeperName, roomNumber, notes);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("[Email] Sent task assignment notification to: {} for room: {}", toEmail, roomNumber);
        } catch (MessagingException e) {
            log.error("[Email] FAILED to send task assignment notification to: {} — {}",
                    toEmail, e.getMessage(), e);
        }
    }

    private String buildTaskAssignmentHtml(String housekeeperName, String roomNumber, String notes) {
        String safeNotes = (notes != null && !notes.isBlank()) ? notes : "No additional notes";
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                      🧹 New Housekeeping Task Assigned
                    </h2>
                    <p style="color: #555;">Hello <strong>%s</strong>,</p>
                    <p style="color: #555;">You have been assigned a new cleaning task:</p>
                    <table style="width: 100%%; border-collapse: collapse; margin: 15px 0;">
                      <tr>
                        <td style="padding: 10px; background: #ecf0f1; font-weight: bold; width: 30%%;">Room</td>
                        <td style="padding: 10px; background: #ecf0f1;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; font-weight: bold;">Status</td>
                        <td style="padding: 10px;">PENDING</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; background: #ecf0f1; font-weight: bold;">Notes</td>
                        <td style="padding: 10px; background: #ecf0f1;">%s</td>
                      </tr>
                    </table>
                    <p style="color: #555;">Please start the cleaning task as soon as possible.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">This is an automated notification from HMS.</p>
                  </div>
                </body>
                </html>
                """.formatted(housekeeperName, roomNumber, safeNotes);
    }

}
