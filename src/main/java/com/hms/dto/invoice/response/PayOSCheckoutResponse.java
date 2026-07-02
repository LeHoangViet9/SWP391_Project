package com.hms.dto.invoice.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PayOSCheckoutResponse {
    private Long orderCode;
    private String paymentLinkId;
    private String checkoutUrl;
    private String qrCode;
}
