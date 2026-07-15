package com.hms.service.checkout.impl;

import com.hms.common.enums.*;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.checkout.request.CheckoutRequestDTO;
import com.hms.dto.checkout.response.CheckoutResponseDTO;
import com.hms.entity.auth.User;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.Invoice;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomStateHistory;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.housekeeping.HouseKeepingTaskRepository;
import com.hms.repository.housekeeping.RoomStateHistoryRepository;
import com.hms.service.checkout.CheckoutService;
import com.hms.service.housekeeping.IHouseKeepingTaskService;
import com.hms.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CheckoutServiceImpl implements CheckoutService {

    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final RoomRepository roomRepository;
    private final RoomStateHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;
    private final IHouseKeepingTaskService housekeepingTaskService;
    private final NotificationService notificationService;
    private final HouseKeepingTaskRepository houseKeepingTaskRepository;

    @Override
    @Transactional(readOnly = true)
    public CheckoutResponseDTO getBill(Long bookingId) {
        Booking booking = findBooking(bookingId);
        validateCheckedIn(booking);
        return response(booking, booking.getInvoice(), getSurchargeInvoice(booking), null);
    }

    @Override
    @Transactional
    public CheckoutResponseDTO confirmPayment(CheckoutRequestDTO request, Long userId) {
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findByIdWithPessimisticWrite(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("checkout.booking.not.found", new Object[]{request.getBookingId()}, locale)));

        if (booking.getBookingStatus() == BookingStatus.CHECKED_OUT) {
            throw new ConflictException(messageSource.getMessage("checkout.booking.already.checked.out", new Object[]{booking.getId()}, locale));
        }

        validateCheckedIn(booking);
        Invoice roomInvoice = requireInvoice(booking);
        BigDecimal charges = value(request.getAdditionalCharges());
        PaymentMethod method = request.getPaymentMethod();

        if (roomsOf(booking).stream().allMatch(room -> room.getRoomStatus() == RoomStatus.CHECKOUT_PENDING)) {
            Invoice surcharge = getSurchargeInvoice(booking);
            if (surcharge != null && Boolean.TRUE.equals(request.getPaymentConfirmed())) {
                if (method == null) {
                    throw new BadRequestException(messageSource.getMessage("checkout.payment.method.required", null, locale));
                }
                if (method == PaymentMethod.CASH && value(request.getCashReceived()).compareTo(charges) < 0) {
                    throw new BadRequestException(messageSource.getMessage("checkout.cash.insufficient", null, locale));
                }
                surcharge.setPaymentMethod(method);
                surcharge.setPaymentConfirmed(true);
                surcharge.setPaymentStatus(PaymentStatus.PAID);
                surcharge.setPaidAt(LocalDateTime.now());
                if (method == PaymentMethod.CASH) {
                    surcharge.setCashReceived(request.getCashReceived());
                    surcharge.setChangeAmount(value(request.getCashReceived()).subtract(charges));
                } else {
                    surcharge.setCashReceived(null);
                    surcharge.setChangeAmount(null);
                }
                invoiceRepository.save(surcharge);

                String notifTitle = messageSource.getMessage("notification.surcharge.payment.success.title", null, locale);
                String notifMsg = messageSource.getMessage("notification.surcharge.payment.success.message", new Object[]{booking.getId(), method, charges}, locale);
                notificationService.notifyReceptionistsAndManagers(notifTitle, notifMsg, "/dashboard/invoices");
            }
            return response(booking, roomInvoice, getSurchargeInvoice(booking), RoomStatus.CHECKOUT_PENDING);
        }

        if (Boolean.TRUE.equals(request.getPaymentConfirmed())) {
            if (charges.signum() > 0 && method == null) {
                throw new BadRequestException(messageSource.getMessage("checkout.payment.method.required", null, locale));
            }
            if (method == PaymentMethod.CASH && value(request.getCashReceived()).compareTo(charges) < 0) {
                throw new BadRequestException(messageSource.getMessage("checkout.cash.insufficient", null, locale));
            }
        }

        Invoice surchargeInvoice = getSurchargeInvoice(booking);
        if (charges.signum() > 0 || (request.getChargeNote() != null && !request.getChargeNote().isEmpty())) {
            boolean isZeroCharge = (charges.compareTo(BigDecimal.ZERO) == 0);
            if (surchargeInvoice == null) {
                surchargeInvoice = Invoice.builder()
                        .booking(booking)
                        .amount(charges)
                        .additionalCharges(charges)
                        .paymentStatus(isZeroCharge || Boolean.TRUE.equals(request.getPaymentConfirmed()) ? PaymentStatus.PAID : PaymentStatus.PENDING)
                        .paymentMethod(method)
                        .paymentConfirmed(isZeroCharge || Boolean.TRUE.equals(request.getPaymentConfirmed()))
                        .paidAt(isZeroCharge || Boolean.TRUE.equals(request.getPaymentConfirmed()) ? LocalDateTime.now() : null)
                        .createdAt(LocalDateTime.now())
                        .note(request.getChargeNote())
                        .invoiceType(InvoiceType.SURCHARGE)
                        .build();
                if (booking.getInvoices() == null) {
                    booking.setInvoices(new java.util.ArrayList<>());
                }
                booking.getInvoices().add(surchargeInvoice);
            } else {
                surchargeInvoice.setAmount(charges);
                surchargeInvoice.setAdditionalCharges(charges);
                surchargeInvoice.setPaymentMethod(method);
                surchargeInvoice.setPaymentConfirmed(isZeroCharge || Boolean.TRUE.equals(request.getPaymentConfirmed()));
                if (isZeroCharge || Boolean.TRUE.equals(request.getPaymentConfirmed())) {
                    surchargeInvoice.setPaymentStatus(PaymentStatus.PAID);
                    surchargeInvoice.setPaidAt(LocalDateTime.now());
                } else {
                    surchargeInvoice.setPaymentStatus(PaymentStatus.PENDING);
                    surchargeInvoice.setPaidAt(null);
                }
                surchargeInvoice.setNote(request.getChargeNote());
            }

            if (Boolean.TRUE.equals(request.getPaymentConfirmed())) {
                if (method == PaymentMethod.CASH) {
                    surchargeInvoice.setCashReceived(request.getCashReceived());
                    surchargeInvoice.setChangeAmount(value(request.getCashReceived()).subtract(charges));
                } else {
                    surchargeInvoice.setCashReceived(null);
                    surchargeInvoice.setChangeAmount(null);
                }
            } else {
                surchargeInvoice.setCashReceived(null);
                surchargeInvoice.setChangeAmount(null);
            }
            invoiceRepository.save(surchargeInvoice);
            if (Boolean.TRUE.equals(request.getPaymentConfirmed()) && charges.compareTo(BigDecimal.ZERO) > 0) {
                String notifTitle = messageSource.getMessage("notification.surcharge.payment.success.title", null, locale);
                String notifMsg = messageSource.getMessage("notification.surcharge.payment.success.message", new Object[]{booking.getId(), method, charges}, locale);
                notificationService.notifyReceptionistsAndManagers(notifTitle, notifMsg, "/dashboard/invoices");
            }
        }

        List<Room> rooms = roomsOf(booking);
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);

        String historyReason = messageSource.getMessage("checkout.room.history.reason.pending", null, locale);
        rooms.forEach(room -> changeRoom(room, RoomStatus.CHECKOUT_PENDING, user, historyReason));
        roomRepository.saveAll(rooms);

        assignHousekeepingTasks(rooms, user);

        return response(booking, roomInvoice, surchargeInvoice, RoomStatus.CHECKOUT_PENDING);
    }

    @Override
    @Transactional
    public CheckoutResponseDTO releaseRoom(Long bookingId, Long userId) {
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findByIdWithPessimisticWrite(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("checkout.booking.not.found", new Object[]{bookingId}, locale)));

        if (booking.getBookingStatus() == BookingStatus.CHECKED_OUT) {
            return response(booking, requireInvoice(booking), getSurchargeInvoice(booking), RoomStatus.DIRTY);
        }

        validateCheckedIn(booking);
        validateCheckoutTime(booking);
        Invoice invoice = requireInvoice(booking);
        List<Room> rooms = roomsOf(booking);

        if (rooms.stream().anyMatch(room -> room.getRoomStatus() != RoomStatus.CHECKOUT_PENDING)) {
            throw new ConflictException(messageSource.getMessage("checkout.payment.first.required", null, locale));
        }

        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        String historyReason = messageSource.getMessage("checkout.room.history.reason.dirty", null, locale);
        rooms.forEach(room -> changeRoom(room, RoomStatus.DIRTY, user, historyReason));

        assignHousekeepingTasks(rooms, user);

        booking.setBookingStatus(BookingStatus.CHECKED_OUT);
        booking.setActualCheckOutTime(LocalDateTime.now());

        bookingRepository.save(booking);
        roomRepository.saveAll(rooms);

        return response(booking, invoice, getSurchargeInvoice(booking), RoomStatus.DIRTY);
    }

    @Override
    @Transactional
    public int autoCheckoutOverdueBookings() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoffExclusive = now.toLocalTime().isBefore(LocalTime.NOON)
                ? now.toLocalDate().atStartOfDay()
                : now.toLocalDate().plusDays(1).atStartOfDay();

        List<Booking> candidates = bookingRepository.findCheckedInDueForAutoCheckout(cutoffExclusive);
        int processed = 0;
        for (Booking candidate : candidates) {
            Booking booking = bookingRepository.findByIdWithPessimisticWrite(candidate.getId()).orElse(null);
            if (booking == null
                    || booking.getBookingStatus() != BookingStatus.CHECKED_IN
                    || !isCheckoutDeadlinePassed(booking, now)) {
                continue;
            }

            List<Room> rooms = roomsOf(booking);
            String historyReason = "Hệ thống tự động check-out sau 12:00 ngày trả phòng.";
            rooms.forEach(room -> changeRoom(room, RoomStatus.DIRTY, null, historyReason));
            assignHousekeepingTasks(rooms, null);

            booking.setBookingStatus(BookingStatus.CHECKED_OUT);
            booking.setActualCheckOutTime(now);

            bookingRepository.save(booking);
            roomRepository.saveAll(rooms);
            processed++;
        }
        return processed;
    }

    private Booking findBooking(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("checkout.booking.not.found", new Object[]{id}, locale)));
    }

    private void validateCheckedIn(Booking booking) {
        Locale locale = LocaleContextHolder.getLocale();
        if (booking.getBookingStatus() != BookingStatus.CHECKED_IN) {
            throw new ConflictException(messageSource.getMessage("checkout.booking.invalid.status", null, locale));
        }
    }

    private void validateCheckoutTime(Booking booking) {
        if (isCheckoutDeadlinePassed(booking, LocalDateTime.now())) {
            throw new ConflictException("Chỉ được check-out từ 12:00 ngày trả phòng trở về trước.");
        }
    }

    private boolean isCheckoutDeadlinePassed(Booking booking, LocalDateTime now) {
        LocalDateTime checkoutDeadline = booking.getCheckOutDate().toLocalDate().atTime(12, 0);
        return now.isAfter(checkoutDeadline);
    }

    private Invoice requireInvoice(Booking booking) {
        Locale locale = LocaleContextHolder.getLocale();
        if (booking.getInvoice() == null) {
            throw new ConflictException(messageSource.getMessage("checkout.invoice.room.missing", null, locale));
        }
        return booking.getInvoice();
    }

    private List<Room> roomsOf(Booking booking) {
        Locale locale = LocaleContextHolder.getLocale();
        if (booking.getRooms() != null && !booking.getRooms().isEmpty()) return booking.getRooms();
        if (booking.getRoom() != null) return List.of(booking.getRoom());
        throw new ConflictException(messageSource.getMessage("checkout.room.not.assigned", null, locale));
    }

    private void changeRoom(Room room, RoomStatus status, User user, String reason) {
        RoomStatus previous = room.getRoomStatus();
        
        // Prevent regression of room state if the task has already progressed
        if (status == RoomStatus.DIRTY && (previous == RoomStatus.CLEANING 
                || previous == RoomStatus.READY 
                || previous == RoomStatus.MAINTENANCE 
                || previous == RoomStatus.AVAILABLE)) {
            return;
        }

        room.setRoomStatus(status);
        historyRepository.save(RoomStateHistory.builder()
                .room(room).previousState(previous).currentState(status)
                .triggeredByProcess(ProcessTrigger.CHECKOUT).triggeredByUser(user).reason(reason).build());
    }

    private void assignHousekeepingTasks(List<Room> rooms, User checkoutUser) {
        for (Room room : rooms) {
            housekeepingTaskService.autoCreateCleaningTaskOnCheckout(
                    room.getId(),
                    checkoutUser == null ? null : checkoutUser.getId()
            );
        }
    }

    private BigDecimal value(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }

    private Invoice getSurchargeInvoice(Booking booking) {
        if (booking.getInvoices() == null) return null;
        return booking.getInvoices().stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.SURCHARGE)
                .findFirst()
                .orElse(null);
    }

    private CheckoutResponseDTO response(Booking booking, Invoice roomInvoice, Invoice surchargeInvoice, RoomStatus status) {
        List<Room> rooms = roomsOf(booking);
        BigDecimal additional = surchargeInvoice != null ? value(surchargeInvoice.getAmount()) : BigDecimal.ZERO;
        BigDecimal cashReceived = surchargeInvoice != null ? surchargeInvoice.getCashReceived() : null;
        BigDecimal changeAmount = surchargeInvoice != null ? surchargeInvoice.getChangeAmount() : null;
        PaymentStatus paymentStatus = surchargeInvoice != null ? surchargeInvoice.getPaymentStatus() : roomInvoice.getPaymentStatus();

        RoomStatus finalRoomStatus = status;
        if (finalRoomStatus == null) {
            finalRoomStatus = rooms.isEmpty() ? null : rooms.get(0).getRoomStatus();
        }

        // Lấy thời điểm lễ tân bấm "Yêu cầu kiểm phòng" từ task housekeeping gần nhất có flag checkoutInspectionRequestedAt.
        LocalDateTime inspectionRequestedAt = null;
        if (!rooms.isEmpty()) {
            inspectionRequestedAt = houseKeepingTaskRepository
                    .findPendingCheckoutInspectionTasks(
                            List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS))
                    .stream()
                    .filter(t -> rooms.stream().anyMatch(r -> r.getId().equals(t.getRoom().getId())))
                    .map(t -> t.getCheckoutInspectionRequestedAt())
                    .filter(dt -> dt != null)
                    .findFirst()
                    .orElse(null);
        }

        return CheckoutResponseDTO.builder()
                .bookingId(booking.getId()).invoiceId(roomInvoice.getId())
                .customerName(booking.getCustomer() != null ? booking.getCustomer().getFullName() : "N/A")
                .roomNumbers(rooms.stream().map(Room::getRoomNumber).toList())
                .originalAmount(value(roomInvoice.getAmount()))
                .additionalCharges(additional).amountDue(additional)
                .cashReceived(cashReceived).changeAmount(changeAmount)
                .paymentStatus(paymentStatus).bookingStatus(booking.getBookingStatus())
                .roomStatus(finalRoomStatus)
                .minibarChecked(surchargeInvoice != null)
                .chargeNote(surchargeInvoice != null ? surchargeInvoice.getNote() : null)
                .checkoutTime(booking.getActualCheckOutTime())
                .inspectionRequestedAt(inspectionRequestedAt)
                .build();
    }
}
