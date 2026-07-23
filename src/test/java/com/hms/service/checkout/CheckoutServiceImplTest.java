package com.hms.service.checkout;

import com.hms.common.enums.BookingStatus;
import com.hms.entity.booking.Booking;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.housekeeping.HouseKeepingTaskRepository;
import com.hms.repository.housekeeping.RoomStateHistoryRepository;
import com.hms.service.checkout.impl.CheckoutServiceImpl;
import com.hms.service.housekeeping.IHouseKeepingTaskService;
import com.hms.service.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceImplTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private RoomStateHistoryRepository historyRepository;
    @Mock private UserRepository userRepository;
    @Mock private MessageSource messageSource;
    @Mock private IHouseKeepingTaskService housekeepingTaskService;
    @Mock private NotificationService notificationService;
    @Mock private HouseKeepingTaskRepository houseKeepingTaskRepository;

    @InjectMocks private CheckoutServiceImpl checkoutService;

    @Test
    void autoCheckoutClosesConfirmedBookingWhenCustomerNeverCheckedIn() {
        Booking booking = Booking.builder()
                .id(42L)
                .bookingStatus(BookingStatus.CONFIRMED)
                .checkOutDate(LocalDateTime.now().minusDays(1))
                .rooms(new ArrayList<>())
                .build();

        when(bookingRepository.findDueForAutoCheckout(any(), any())).thenReturn(List.of(booking));
        when(bookingRepository.findByIdWithPessimisticWrite(42L)).thenReturn(Optional.of(booking));

        int processed = checkoutService.autoCheckoutOverdueBookings();

        assertEquals(1, processed);
        assertEquals(BookingStatus.CHECKED_OUT, booking.getBookingStatus());
        assertNotNull(booking.getActualCheckInTime());
        assertNotNull(booking.getActualCheckOutTime());
        assertEquals(booking.getActualCheckInTime(), booking.getActualCheckOutTime());
        verify(bookingRepository).save(booking);
        verifyNoInteractions(housekeepingTaskService);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<BookingStatus>> statuses = ArgumentCaptor.forClass(Collection.class);
        verify(bookingRepository).findDueForAutoCheckout(statuses.capture(), any());
        assertTrue(statuses.getValue().containsAll(List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN)));
    }
}
