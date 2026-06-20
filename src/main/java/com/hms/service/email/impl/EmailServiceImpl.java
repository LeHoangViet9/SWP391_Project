package com.hms.service.email.impl;

import com.hms.entity.auth.User;
import com.hms.repository.auth.UserRepository;
import com.hms.service.email.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
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
    private final UserRepository userRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private String getDisplayName(String email) {
        if (email == null || email.isBlank()) {
            return "User";
        }
        try {
            return userRepository.findUserByEmail(email)
                    .map(User::getFullName)
                    .orElseGet(() -> {
                        String[] parts = email.split("@");
                        return parts.length > 0 ? parts[0] : "User";
                    });
        } catch (Exception e) {
            log.warn("[Email] Failed to lookup display name for {}: {}", email, e.getMessage());
            String[] parts = email.split("@");
            return parts.length > 0 ? parts[0] : "User";
        }
    }

    @Override
    public void sendForgotPasswordMail(String to, String token) {
        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        Locale locale = LocaleContextHolder.getLocale();
        boolean isVi = locale.getLanguage().equals("vi");

        String displayName = getDisplayName(to);
        String title = isVi ? "Đặt lại mật khẩu HMS" : "Reset your HMS password";
        String heading = isVi ? 
                "Yêu cầu đặt lại mật khẩu, <strong>" + displayName + "</strong>" : 
                "Password reset request, <strong>" + displayName + "</strong>";
        
        String codeLabel = isVi ? 
                "Dưới đây là mã xác thực đặt lại mật khẩu HMS của bạn:" : 
                "Here is your HMS password reset authentication code:";

        String warningHtml = isVi ? 
                "Mã này có hiệu lực trong <strong>15 phút</strong> và chỉ có thể sử dụng một lần.<br><br>" +
                "Hoặc bạn có thể click vào nút dưới đây để đặt lại mật khẩu trực tiếp:<br><br>" +
                "<div style=\"text-align: center; margin: 24px 0;\">" +
                "  <a href=\"" + resetLink + "\" style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; background-color: #003580; text-decoration: none; padding: 12px 24px; border-radius: 4px; display: inline-block;\">Đặt lại mật khẩu</a>" +
                "</div>" +
                "<strong>Vui lòng không chia sẻ mã này với bất kỳ ai:</strong> chúng tôi sẽ không bao giờ yêu cầu mã này qua điện thoại hoặc email." :
                
                "This code is valid for <strong>15 minutes</strong> and can only be used once.<br><br>" +
                "Or you can click the button below to reset your password directly:<br><br>" +
                "<div style=\"text-align: center; margin: 24px 0;\">" +
                "  <a href=\"" + resetLink + "\" style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; background-color: #003580; text-decoration: none; padding: 12px 24px; border-radius: 4px; display: inline-block;\">Reset Password</a>" +
                "</div>" +
                "<strong>Please don't share this code with anyone:</strong> we'll never ask for it on the phone or via email.";

        String footerNote = isVi ? 
                "Bạn nhận được email này vì một yêu cầu khôi phục mật khẩu đã được tạo cho tài khoản HMS của bạn. Nếu đây không phải là bạn, vui lòng bỏ qua email này." : 
                "You're receiving this email because a password reset request was made for your HMS account. If this wasn't you, please ignore this email.";

        String subject = messageSource.getMessage("reset.password", null, locale);
        String htmlContent = buildHtmlTemplate(title, heading, codeLabel, token, warningHtml, footerNote, locale);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[Email] Sent forgot-password HTML mail to: {}", to);
        } catch (Exception e) {
            log.error("[Email] FAILED to send forgot-password mail to: {} — {}", to, e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void sendRegistrationOtp(String to, String otpCode) {
        Locale locale = LocaleContextHolder.getLocale();
        boolean isVi = locale.getLanguage().equals("vi");

        String displayName = getDisplayName(to);
        String title = isVi ? "Xác thực danh tính" : "Verify your identity";
        String heading = isVi ? 
                "Vui lòng xác thực danh tính của bạn, <strong>" + displayName + "</strong>" : 
                "Please verify your identity, <strong>" + displayName + "</strong>";
        
        String codeLabel = isVi ? 
                "Đây là mã xác thực đăng ký HMS của bạn:" : 
                "Here is your HMS registration authentication code:";

        String warningHtml = isVi ? 
                "Mã này có hiệu lực trong <strong>5 phút</strong> và chỉ có thể sử dụng một lần.<br><br>" +
                "<strong>Vui lòng không chia sẻ mã này với bất kỳ ai:</strong> chúng tôi sẽ không bao giờ yêu cầu mã này qua điện thoại hoặc email." :
                
                "This code is valid for <strong>5 minutes</strong> and can only be used once.<br><br>" +
                "<strong>Please don't share this code with anyone:</strong> we'll never ask for it on the phone or via email.";

        String footerNote = isVi ? 
                "Bạn nhận được email này vì mã xác thực đã được yêu cầu cho tài khoản HMS của bạn. Nếu đây không phải là bạn, vui lòng bỏ qua email này." : 
                "You're receiving this email because a verification code was requested for your HMS account. If this wasn't you, please ignore this email.";

        String subject = messageSource.getMessage("otp.registration.subject", null, locale);
        String htmlContent = buildHtmlTemplate(title, heading, codeLabel, otpCode, warningHtml, footerNote, locale);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[Email] Sent OTP HTML mail {} to: {}", otpCode, to);
        } catch (Exception e) {
            log.error("[Email] FAILED to send OTP mail to: {} — {}", to, e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    private String buildHtmlTemplate(String title, String heading, String codeLabel, String code, String warningHtml, String footerNote, Locale locale) {
        boolean isVi = locale.getLanguage().equals("vi");
        String thanks = isVi ? "Trân trọng," : "Thanks,";
        String teamName = isVi ? "Đội ngũ HMS" : "The HMS Team";
        String copyright = isVi ? "© 2026 HMS Hotel. Bảo lưu mọi quyền." : "© 2026 HMS Hotel. All rights reserved.";
        
        StringBuilder spacedCode = new StringBuilder();
        if (code != null) {
            for (int i = 0; i < code.length(); i++) {
                spacedCode.append(code.charAt(i));
                if (i < code.length() - 1) {
                    spacedCode.append(" ");
                }
            }
        }

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>" + title + "</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n" +
                "            background-color: #ffffff;\n" +
                "            margin: 0;\n" +
                "            padding: 40px 20px;\n" +
                "            color: #24292e;\n" +
                "            -webkit-font-smoothing: antialiased;\n" +
                "        }\n" +
                "        .wrapper {\n" +
                "            max-width: 480px;\n" +
                "            margin: 0 auto;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .logo-container {\n" +
                "            margin-bottom: 24px;\n" +
                "        }\n" +
                "        .logo {\n" +
                "            font-size: 28px;\n" +
                "            font-weight: 800;\n" +
                "            color: #003580;\n" +
                "            text-decoration: none;\n" +
                "            letter-spacing: 1px;\n" +
                "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n" +
                "        }\n" +
                "        .logo span {\n" +
                "            color: #ffd700;\n" +
                "        }\n" +
                "        .title {\n" +
                "            font-size: 22px;\n" +
                "            line-height: 1.4;\n" +
                "            font-weight: 400;\n" +
                "            color: #24292e;\n" +
                "            margin: 0 0 24px 0;\n" +
                "        }\n" +
                "        .title strong {\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        .card {\n" +
                "            background: #ffffff;\n" +
                "            border: 1px solid #e1e4e8;\n" +
                "            border-radius: 6px;\n" +
                "            padding: 32px 24px;\n" +
                "            text-align: left;\n" +
                "            margin-bottom: 24px;\n" +
                "            box-shadow: 0 1px 3px rgba(0,0,0,0.02);\n" +
                "        }\n" +
                "        .card-header {\n" +
                "            font-size: 14px;\n" +
                "            line-height: 1.5;\n" +
                "            color: #24292e;\n" +
                "            margin: 0 0 20px 0;\n" +
                "        }\n" +
                "        .code-container {\n" +
                "            text-align: center;\n" +
                "            margin: 28px 0;\n" +
                "        }\n" +
                "        .code {\n" +
                "            font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;\n" +
                "            font-size: 28px;\n" +
                "            font-weight: 500;\n" +
                "            color: #24292e;\n" +
                "            display: inline-block;\n" +
                "            padding: 10px 20px;\n" +
                "            background-color: #fafbfc;\n" +
                "            border-radius: 4px;\n" +
                "            border: 1px solid #e1e4e8;\n" +
                "            letter-spacing: 4px;\n" +
                "        }\n" +
                "        .warning-text {\n" +
                "            font-size: 13px;\n" +
                "            line-height: 1.6;\n" +
                "            color: #586069;\n" +
                "            margin: 0 0 20px 0;\n" +
                "            border-top: 1px solid #eaecef;\n" +
                "            padding-top: 20px;\n" +
                "        }\n" +
                "        .sign-off {\n" +
                "            font-size: 14px;\n" +
                "            line-height: 1.5;\n" +
                "            color: #24292e;\n" +
                "            margin: 20px 0 0 0;\n" +
                "        }\n" +
                "        .footer {\n" +
                "            font-size: 12px;\n" +
                "            line-height: 1.6;\n" +
                "            color: #586069;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .footer p {\n" +
                "            margin: 0 0 8px 0;\n" +
                "        }\n" +
                "        .footer-address {\n" +
                "            margin-top: 16px;\n" +
                "            color: #a3aab1;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"wrapper\">\n" +
                "        <div class=\"logo-container\">\n" +
                "            <a href=\"#\" class=\"logo\">HMS<span>Hotel</span></a>\n" +
                "        </div>\n" +
                "        <h1 class=\"title\">" + heading + "</h1>\n" +
                "        <div class=\"card\">\n" +
                "            <p class=\"card-header\">" + codeLabel + "</p>\n" +
                "            " + (code != null && !code.isEmpty() ? "<div class=\"code-container\"><span class=\"code\">" + spacedCode.toString() + "</span></div>" : "") + "\n" +
                "            <div class=\"warning-text\">\n" +
                "                " + warningHtml + "\n" +
                "            </div>\n" +
                "            <p class=\"sign-off\">\n" +
                "                " + thanks + "<br>\n" +
                "                <strong>" + teamName + "</strong>\n" +
                "            </p>\n" +
                "        </div>\n" +
                "        <div class=\"footer\">\n" +
                "            <p>" + footerNote + "</p>\n" +
                "            <p class=\"footer-address\">HMS Hotel, Inc. • 88 Colin P Kelly Jr Street • San Francisco, CA 94107</p>\n" +
                "        </div>\n" +
                "        <div class=\"footer-address\" style=\"font-size: 11px; text-align: center; margin-top: 10px;\">" + copyright + "</div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
