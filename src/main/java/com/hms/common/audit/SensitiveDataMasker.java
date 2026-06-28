package com.hms.common.audit;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Component
public class SensitiveDataMasker {

    private static final Set<String> BLOCKED_KEYS = Set.of(
            "password", "repassword", "oldpassword", "newpassword", "confirmpassword",
            "token", "accesstoken", "refreshtoken", "resetpasswordtoken", "otp", "otpcode",
            "apikey", "apisecret", "secret"
    );

    public Object mask(Object value) {
        if (value instanceof Map<?, ?> map) {
            return maskMap(map);
        }
        if (value instanceof List<?> list) {
            List<Object> masked = new ArrayList<>();
            for (Object item : list) {
                masked.add(mask(item));
            }
            return masked;
        }
        return value;
    }

    public Map<String, Object> maskMap(Map<?, ?> input) {
        Map<String, Object> masked = new HashMap<>();
        for (Map.Entry<?, ?> entry : input.entrySet()) {
            String key = String.valueOf(entry.getKey());
            masked.put(key, maskValueByKey(key, entry.getValue()));
        }
        return masked;
    }

    private Object maskValueByKey(String key, Object value) {
        if (value == null) {
            return null;
        }

        String normalizedKey = key.toLowerCase(Locale.ROOT).replace("_", "").replace("-", "");
        if (BLOCKED_KEYS.contains(normalizedKey)) {
            return "[REDACTED]";
        }

        if (value instanceof Map<?, ?> map) {
            return maskMap(map);
        }
        if (value instanceof List<?> list) {
            return mask(list);
        }
        if (!(value instanceof String text)) {
            return value;
        }

        if (normalizedKey.contains("email")) {
            return maskEmail(text);
        }
        if (normalizedKey.contains("phone")) {
            return maskKeepLast(text, 4);
        }
        if (normalizedKey.contains("idnumber")
                || normalizedKey.contains("identity")
                || normalizedKey.contains("passport")
                || normalizedKey.contains("cccd")) {
            return maskKeepLast(text, 4);
        }
        if (normalizedKey.contains("cardnumber") || normalizedKey.equals("card")) {
            return maskCard(text);
        }

        return text;
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        String visible = localPart.substring(0, Math.min(2, localPart.length()));
        return visible + "***" + domain;
    }

    private String maskKeepLast(String value, int keepLast) {
        String normalized = value.replaceAll("\\s+", "");
        if (normalized.length() <= keepLast) {
            return "*".repeat(normalized.length());
        }
        return "*".repeat(normalized.length() - keepLast) + normalized.substring(normalized.length() - keepLast);
    }

    private String maskCard(String cardNumber) {
        String digits = cardNumber.replaceAll("\\D", "");
        if (digits.length() < 4) {
            return "****";
        }
        return "**** **** **** " + digits.substring(digits.length() - 4);
    }
}
