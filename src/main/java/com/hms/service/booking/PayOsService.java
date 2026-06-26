package com.hms.service.booking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hms.common.config.PayOsProperties;
import com.hms.common.exception.BadRequestException;
import com.hms.entity.booking.Invoice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class PayOsService {

    private final PayOsProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public PayOsPaymentLink createPaymentLink(Invoice invoice) {
        validateConfig();

        long orderCode = invoice.getId();
        long amount = invoice.getAmount()
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
        String description = "HMS" + invoice.getBooking().getId();

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("orderCode", orderCode);
        payload.put("amount", amount);
        payload.put("description", description);
        payload.put("returnUrl", properties.getReturnUrl());
        payload.put("cancelUrl", properties.getCancelUrl());
        payload.put("signature", signCreatePaymentData(orderCode, amount, description));

        JsonNode response = send("POST", "/v2/payment-requests", payload);
        JsonNode data = response.path("data");
        return new PayOsPaymentLink(
                data.path("paymentLinkId").asText(null),
                data.path("checkoutUrl").asText(null),
                data.path("qrCode").asText(null)
        );
    }

    public PayOsPaymentStatus getPaymentStatus(long orderCode) {
        validateConfig();

        JsonNode response = send("GET", "/v2/payment-requests/" + orderCode, null);
        JsonNode data = response.path("data");
        return new PayOsPaymentStatus(
                data.path("orderCode").asLong(orderCode),
                data.path("status").asText(null),
                data.path("paymentLinkId").asText(null),
                data.path("checkoutUrl").asText(null)
        );
    }

    public boolean isValidWebhook(JsonNode webhookBody) {
        JsonNode data = webhookBody.path("data");
        String receivedSignature = webhookBody.path("signature").asText("");
        if (!data.isObject() || !StringUtils.hasText(receivedSignature)) {
            return false;
        }
        String rawData = buildSortedDataString(data);
        String expectedSignature = hmacSha256(rawData);
        return expectedSignature.equalsIgnoreCase(receivedSignature);
    }

    private JsonNode send(String method, String path, JsonNode body) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getApiBaseUrl() + path))
                    .timeout(Duration.ofSeconds(20))
                    .header("x-client-id", properties.getClientId())
                    .header("x-api-key", properties.getApiKey())
                    .header("Content-Type", "application/json");

            if ("POST".equalsIgnoreCase(method)) {
                builder.POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
            } else {
                builder.GET();
            }

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || json.path("code").asInt(0) != 0) {
                String message = json.path("desc").asText("PayOS request failed");
                throw new BadRequestException(message);
            }
            return json;
        } catch (BadRequestException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadRequestException("Khong the ket noi PayOS: " + exception.getMessage());
        }
    }

    private String signCreatePaymentData(long orderCode, long amount, String description) {
        String rawData = "amount=" + amount
                + "&cancelUrl=" + properties.getCancelUrl()
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + properties.getReturnUrl();
        return hmacSha256(rawData);
    }

    private String buildSortedDataString(JsonNode data) {
        Map<String, String> sorted = new TreeMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = data.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            JsonNode value = entry.getValue();
            if (!value.isNull()) {
                sorted.put(entry.getKey(), value.isTextual() ? value.asText() : value.toString());
            }
        }

        StringBuilder builder = new StringBuilder();
        sorted.forEach((key, value) -> {
            if (!builder.isEmpty()) {
                builder.append('&');
            }
            builder.append(key).append('=').append(value);
        });
        return builder.toString();
    }

    private String hmacSha256(String rawData) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getChecksumKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(rawData.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception exception) {
            throw new BadRequestException("Khong the tao chu ky PayOS");
        }
    }

    private void validateConfig() {
        if (!StringUtils.hasText(properties.getClientId())
                || !StringUtils.hasText(properties.getApiKey())
                || !StringUtils.hasText(properties.getChecksumKey())
                || !StringUtils.hasText(properties.getReturnUrl())
                || !StringUtils.hasText(properties.getCancelUrl())) {
            throw new BadRequestException("Chua cau hinh day du PayOS");
        }
    }

    public record PayOsPaymentLink(String paymentLinkId, String checkoutUrl, String qrCode) {
    }

    public record PayOsPaymentStatus(long orderCode, String status, String paymentLinkId, String checkoutUrl) {
    }
}
