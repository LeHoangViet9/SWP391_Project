package com.hms.service.booking;

import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("invoiceAccessService")
@RequiredArgsConstructor
public class InvoiceAccessService {
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public boolean canAccessBookings(List<Long> bookingIds, Authentication authentication) {
        if (!isAuthenticated(authentication) || bookingIds == null || bookingIds.isEmpty()) return false;
        if (hasInvoiceView(authentication)) return true;

        List<Long> ids = bookingIds.stream().filter(java.util.Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) return false;
        var bookings = bookingRepository.findAllById(ids);
        return bookings.size() == ids.size() && bookings.stream().allMatch(booking ->
                booking.getCustomer() != null
                        && booking.getCustomer().getEmail().equalsIgnoreCase(authentication.getName()));
    }

    public boolean canAccessBooking(Long bookingId, Authentication authentication) {
        return bookingId != null && canAccessBookings(List.of(bookingId), authentication);
    }

    @Transactional(readOnly = true)
    public boolean canAccessInvoice(Long invoiceId, Authentication authentication) {
        if (!isAuthenticated(authentication) || invoiceId == null) return false;
        if (hasInvoiceView(authentication)) return true;
        return invoiceRepository.findById(invoiceId)
                .map(invoice -> invoice.getBooking() != null
                        && invoice.getBooking().getCustomer() != null
                        && invoice.getBooking().getCustomer().getEmail().equalsIgnoreCase(authentication.getName()))
                .orElse(false);
    }

    private boolean hasInvoiceView(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "INVOICE_VIEW".equals(authority.getAuthority()));
    }

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName());
    }
}
