package com.hms.service.booking;

import com.hms.common.exception.BadRequestException;
import com.hms.dto.invoice.response.CombinedInvoiceResponse;
import com.hms.dto.invoice.response.PayOSCheckoutResponse;
import com.hms.entity.booking.PayOSPayment;
import com.hms.repository.booking.PayOSPaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.webhooks.Webhook;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;

@Service
@RequiredArgsConstructor
public class PayOSPaymentService {
    private final PayOS payOS;
    private final PayOSPaymentRepository paymentRepository;
    private final InvoiceService invoiceService;

    @Value("${payos.return-url}") private String returnUrl;
    @Value("${payos.cancel-url}") private String cancelUrl;

    @Transactional
    public PayOSCheckoutResponse createCheckout(List<Long> bookingIds) throws Exception {
        CombinedInvoiceResponse invoice = invoiceService.getCombinedInvoice(bookingIds);
        if (invoice.getPaymentStatus().name().equals("PAID")) {
            throw new BadRequestException("Hóa đơn đã được thanh toán.");
        }

        String normalizedBookingIds = bookingIds.stream().distinct().sorted()
                .map(String::valueOf).reduce((a, b) -> a + "," + b).orElseThrow();
        var existingPayment = paymentRepository.findTopByBookingIdsOrderByCreatedAtDesc(normalizedBookingIds);
        if (existingPayment.isPresent() && "PENDING".equals(existingPayment.get().getStatus())) {
            return toResponse(existingPayment.get());
        }

        long orderCode = nextOrderCode();
        long amount = invoice.getTotalAmount().longValueExact();
        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount)
                .description("HMS " + orderCode)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .build();

        var link = payOS.paymentRequests().create(request);
        PayOSPayment payment = PayOSPayment.builder()
                .orderCode(orderCode)
                .bookingIds(normalizedBookingIds)
                .paymentLinkId(link.getPaymentLinkId())
                .checkoutUrl(link.getCheckoutUrl())
                .qrCode(toQrDataUrl(link.getQrCode()))
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Transactional
    public void handleWebhook(Webhook webhook) throws Exception {
        var data = payOS.webhooks().verify(webhook);
        PayOSPayment payment = paymentRepository.findById(data.getOrderCode())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy giao dịch payOS."));
        if ("PAID".equals(payment.getStatus())) return;
        if (!"00".equals(data.getCode())) return;

        markAsPaid(payment);
    }

    /** Local-development fallback when payOS cannot call a localhost webhook. */
    @Transactional
    public String synchronizeStatus(Long orderCode) throws Exception {
        PayOSPayment payment = paymentRepository.findById(orderCode)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy giao dịch payOS."));
        if ("PAID".equals(payment.getStatus())) return payment.getStatus();

        var paymentLink = payOS.paymentRequests().get(orderCode);
        String payOSStatus = String.valueOf(paymentLink.getStatus());
        if ("PAID".equalsIgnoreCase(payOSStatus)) {
            markAsPaid(payment);
        }
        return payment.getStatus();
    }

    private void markAsPaid(PayOSPayment payment) {
        List<Long> bookingIds = Arrays.stream(payment.getBookingIds().split(","))
                .map(Long::valueOf).toList();
        invoiceService.confirmCombinedPaymentSuccess(bookingIds);
        payment.setStatus("PAID");
        paymentRepository.save(payment);
    }

    private synchronized long nextOrderCode() {
        long candidate = System.currentTimeMillis();
        while (paymentRepository.existsById(candidate)) candidate++;
        return candidate;
    }

    private PayOSCheckoutResponse toResponse(PayOSPayment payment) {
        return PayOSCheckoutResponse.builder()
                .orderCode(payment.getOrderCode())
                .paymentLinkId(payment.getPaymentLinkId())
                .checkoutUrl(payment.getCheckoutUrl())
                .qrCode(payment.getQrCode())
                .build();
    }

    private String toQrDataUrl(String qrPayload) throws Exception {
        var matrix = new QRCodeWriter().encode(qrPayload, BarcodeFormat.QR_CODE, 360, 360);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        }
    }
}
