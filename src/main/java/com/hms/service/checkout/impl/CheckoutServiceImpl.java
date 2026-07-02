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
import com.hms.entity.housekeeping.HouseKeepingTask;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.housekeeping.RoomStateHistoryRepository;
import com.hms.repository.housekeeping.HouseKeepingTaskRepository;
import com.hms.service.checkout.CheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckoutServiceImpl implements CheckoutService {
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final RoomRepository roomRepository;
    private final RoomStateHistoryRepository historyRepository;
    private final HouseKeepingTaskRepository housekeepingTaskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public CheckoutResponseDTO getBill(Long bookingId) {
        Booking booking = findBooking(bookingId);
        validateCheckedIn(booking);
        return response(booking, booking.getInvoice(), null);
    }

    @Override
    @Transactional
    public CheckoutResponseDTO confirmPayment(CheckoutRequestDTO request, Long userId) {
        Booking booking = bookingRepository.findByIdWithPessimisticWrite(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng #" + request.getBookingId()));
        validateCheckedIn(booking);
        Invoice invoice = requireInvoice(booking);
        BigDecimal charges = value(request.getAdditionalCharges());
        PaymentMethod method = request.getPaymentMethod();

        if (roomsOf(booking).stream().allMatch(room -> room.getRoomStatus() == RoomStatus.CHECKOUT_PENDING)) {
            return response(booking, invoice, RoomStatus.CHECKOUT_PENDING);
        }

        if (charges.signum() > 0 && method == null) {
            throw new BadRequestException("Vui lòng chọn phương thức thanh toán phụ phí.");
        }
        if (method == PaymentMethod.CASH && value(request.getCashReceived()).compareTo(charges) < 0) {
            throw new BadRequestException("Số tiền nhận phải lớn hơn hoặc bằng phụ phí cần thanh toán.");
        }
        if (charges.signum() > 0 && method != PaymentMethod.CASH && !Boolean.TRUE.equals(request.getPaymentConfirmed())) {
            throw new BadRequestException("Vui lòng xác nhận đã nhận thanh toán từ khách.");
        }

        BigDecimal previousCharges = value(invoice.getAdditionalCharges());
        invoice.setAdditionalCharges(charges);
        invoice.setAmount(value(invoice.getAmount()).subtract(previousCharges).add(charges));
        invoice.setPaymentMethod(method != null ? method : invoice.getPaymentMethod());
        invoice.setPaymentStatus(PaymentStatus.PAID);
        invoice.setPaymentConfirmed(true);
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setNote(request.getChargeNote());
        if (method == PaymentMethod.CASH) {
            invoice.setCashReceived(request.getCashReceived());
            invoice.setChangeAmount(value(request.getCashReceived()).subtract(charges));
        }

        List<Room> rooms = roomsOf(booking);
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        rooms.forEach(room -> changeRoom(room, RoomStatus.CHECKOUT_PENDING, user,
                "Đã xác nhận thanh toán, chờ trả phòng"));
        invoiceRepository.save(invoice);
        roomRepository.saveAll(rooms);
        return response(booking, invoice, RoomStatus.CHECKOUT_PENDING);
    }

    @Override
    @Transactional
    public CheckoutResponseDTO releaseRoom(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findByIdWithPessimisticWrite(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng #" + bookingId));
        if (booking.getBookingStatus() == BookingStatus.CHECKED_OUT) {
            return response(booking, requireInvoice(booking), RoomStatus.DIRTY);
        }
        validateCheckedIn(booking);
        Invoice invoice = requireInvoice(booking);
        List<Room> rooms = roomsOf(booking);
        if (rooms.stream().anyMatch(room -> room.getRoomStatus() != RoomStatus.CHECKOUT_PENDING)) {
            throw new ConflictException("Cần xác nhận thanh toán trước khi giải phóng phòng.");
        }
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        rooms.forEach(room -> changeRoom(room, RoomStatus.DIRTY, user, "Khách đã trả phòng"));
        assignHousekeepingTasks(rooms, user, booking.getId());
        booking.setBookingStatus(BookingStatus.CHECKED_OUT);
        booking.setActualCheckOutTime(LocalDateTime.now());
        bookingRepository.save(booking);
        roomRepository.saveAll(rooms);
        return response(booking, invoice, RoomStatus.DIRTY);
    }

    private Booking findBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng #" + id));
    }

    private void validateCheckedIn(Booking booking) {
        if (booking.getBookingStatus() != BookingStatus.CHECKED_IN) {
            throw new ConflictException("Chỉ có thể check-out đơn đang ở trạng thái CHECKED_IN.");
        }
    }

    private Invoice requireInvoice(Booking booking) {
        if (booking.getInvoice() == null) throw new ConflictException("Đơn chưa có hóa đơn.");
        return booking.getInvoice();
    }

    private List<Room> roomsOf(Booking booking) {
        if (booking.getRooms() != null && !booking.getRooms().isEmpty()) return booking.getRooms();
        if (booking.getRoom() != null) return List.of(booking.getRoom());
        throw new ConflictException("Đơn chưa được gán phòng.");
    }

    private void changeRoom(Room room, RoomStatus status, User user, String reason) {
        RoomStatus previous = room.getRoomStatus();
        room.setRoomStatus(status);
        historyRepository.save(RoomStateHistory.builder()
                .room(room).previousState(previous).currentState(status)
                .triggeredByProcess(ProcessTrigger.CHECKOUT).triggeredByUser(user).reason(reason).build());
    }

    private void assignHousekeepingTasks(List<Room> rooms, User checkoutUser, Long bookingId) {
        List<User> housekeepers = userRepository.findByRole_RoleNameIgnoreCaseAndAccountStatus(
                "HOUSEKEEPER", AccountStatus.ACTIVE);
        if (housekeepers.isEmpty()) {
            throw new ConflictException("Không có nhân viên housekeeping đang hoạt động để nhận phòng dọn.");
        }

        List<TaskStatus> activeStatuses = List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS);
        for (Room room : rooms) {
            User assignedTo = housekeepers.stream()
                    .min(java.util.Comparator.comparingLong(user ->
                            housekeepingTaskRepository.countByAssignedTo_IdAndTaskStatusIn(user.getId(), activeStatuses)))
                    .orElseThrow();
            User assignedBy = checkoutUser != null ? checkoutUser : assignedTo;
            housekeepingTaskRepository.save(HouseKeepingTask.builder()
                    .room(room)
                    .assignedTo(assignedTo)
                    .assignedBy(assignedBy)
                    .taskStatus(TaskStatus.PENDING)
                    .notes("Tự động tạo sau check-out đơn #" + bookingId)
                    .build());
        }
    }

    private BigDecimal value(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }

    private CheckoutResponseDTO response(Booking booking, Invoice invoice, RoomStatus status) {
        List<Room> rooms = roomsOf(booking);
        BigDecimal additional = value(invoice.getAdditionalCharges());
        return CheckoutResponseDTO.builder()
                .bookingId(booking.getId()).invoiceId(invoice.getId())
                .customerName(booking.getCustomer().getFullName())
                .roomNumbers(rooms.stream().map(Room::getRoomNumber).toList())
                .originalAmount(value(invoice.getAmount()).subtract(additional))
                .additionalCharges(additional).amountDue(additional)
                .cashReceived(invoice.getCashReceived()).changeAmount(invoice.getChangeAmount())
                .paymentStatus(invoice.getPaymentStatus()).bookingStatus(booking.getBookingStatus())
                .roomStatus(status != null ? status : rooms.get(0).getRoomStatus())
                .checkoutTime(booking.getActualCheckOutTime()).build();
    }
}
