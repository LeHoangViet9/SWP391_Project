package com.hms.service.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.PaymentStatus;
import com.hms.entity.booking.Booking;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.service.booking.CartHoldService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingHoldScheduler {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final CartHoldService cartHoldService;

    @Scheduled(fixedDelayString = "${app.booking.hold-cleanup-ms:30000}")
    @Transactional
    public void cancelExpiredHolds() {
        List<Booking> expired = bookingRepository.findByBookingStatusAndHoldExpiresAtBefore(
                BookingStatus.PENDING_PAYMENT, LocalDateTime.now());

        for (Booking booking : expired) {
            booking = bookingRepository.findByIdWithPessimisticWrite(booking.getId()).orElse(null);
            if (booking == null
                    || booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT
                    || booking.getHoldExpiresAt() == null
                    || booking.getHoldExpiresAt().isAfter(LocalDateTime.now())) {
                continue;
            }
            booking.setBookingStatus(BookingStatus.CANCELLED);
            booking.setHoldExpiresAt(null);
            if (booking.getInvoice() != null) {
                booking.getInvoice().setPaymentStatus(PaymentStatus.CANCELLED);
            }
            List<com.hms.entity.hotel.Room> heldRooms = booking.getRooms() != null && !booking.getRooms().isEmpty()
                    ? booking.getRooms()
                    : (booking.getRoom() == null ? List.of() : List.of(booking.getRoom()));
            heldRooms.stream()
                    .filter(room -> room.getRoomStatus() == RoomStatus.RESERVED)
                    .forEach(room -> room.setRoomStatus(RoomStatus.AVAILABLE));
            roomRepository.saveAll(heldRooms);
            bookingRepository.save(booking);
            log.info("Cancelled expired room hold for booking {}", booking.getId());
        }
        cartHoldService.expireHolds();
    }
}
