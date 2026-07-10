package com.hms.service.checkout;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AutoCheckoutScheduler {

    private final CheckoutService checkoutService;

    @Scheduled(fixedDelayString = "${app.checkout.auto-checkout-ms:60000}")
    public void autoCheckoutOverdueBookings() {
        int processed = checkoutService.autoCheckoutOverdueBookings();
        if (processed > 0) {
            log.info("Auto checked out {} overdue booking(s)", processed);
        }
    }
}
