package com.hms.service.booking.impl;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.IdType;
import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.BillingUtils;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.request.BookingRoomAssignRequest;
import com.hms.dto.booking.request.BookingStatusRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.dto.checkin.response.AvailableRoomResponseDTO;
import com.hms.entity.auth.User;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.Invoice;
import com.hms.entity.booking.RoomGuestAllocation;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.customer.CustomerFeedbackRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.booking.BookingService;
import com.hms.service.booking.mapper.BookingMapper;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.Map;
import java.util.EnumSet;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final String CCCD_PATTERN = "\\d{12}";

    private static final List<BookingStatus> ROOM_HOLDING_STATUSES = List.of(
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN
    );

    @Value("${app.booking.hold-minutes:30}")
    private long cartHoldMinutes;

    private static final Map<BookingStatus, Set<BookingStatus>> VALID_TRANSITIONS =
            new java.util.EnumMap<>(BookingStatus.class);
    static {
        // Luồng chuẩn: Chờ thanh toán -> Thanh toán xong online thành CONFIRMED hoặc tự hủy khi hết hạn
        VALID_TRANSITIONS.put(BookingStatus.PENDING_PAYMENT,
                EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED));

        // Khi khách đã thanh toán online (CONFIRMED): Khách đến quầy ấn CHECKED_IN, hoặc hủy đơn/no-show quá hạn
        VALID_TRANSITIONS.put(BookingStatus.CONFIRMED,
                EnumSet.of(BookingStatus.CHECKED_IN, BookingStatus.CANCELLED, BookingStatus.NO_SHOW));

        VALID_TRANSITIONS.put(BookingStatus.CHECKED_IN,
                EnumSet.of(BookingStatus.CHECKED_OUT));
        VALID_TRANSITIONS.put(BookingStatus.CHECKED_OUT, EnumSet.noneOf(BookingStatus.class));
        VALID_TRANSITIONS.put(BookingStatus.CANCELLED,   EnumSet.noneOf(BookingStatus.class));
        VALID_TRANSITIONS.put(BookingStatus.NO_SHOW,     EnumSet.noneOf(BookingStatus.class));
    }

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final InvoiceRepository invoiceRepository;
    private final BookingMapper bookingMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;
    private final CustomerFeedbackRepository customerFeedbackRepository;

    private BookingResponse mapToResponse(Booking booking) {
        if (booking == null) return null;
        BookingResponse response = bookingMapper.toResponse(booking);
        response.setHasFeedback(customerFeedbackRepository.existsByBookingId(booking.getId()));
        return response;
    }

    private Page<BookingResponse> mapPageToResponse(Page<Booking> bookingPage) {
        if (bookingPage.isEmpty()) return bookingPage.map(bookingMapper::toResponse);
        Set<Long> ids = bookingPage.getContent().stream().map(Booking::getId).collect(Collectors.toSet());
        Set<Long> feedbackedIds = customerFeedbackRepository.findBookingIdsWithFeedback(ids);
        return bookingPage.map(b -> {
            BookingResponse r = bookingMapper.toResponse(b);
            r.setHasFeedback(feedbackedIds.contains(b.getId()));
            return r;
        });
    }

    private boolean isValidTransition(BookingStatus currentStatus, BookingStatus newStatus) {
        return VALID_TRANSITIONS
                .getOrDefault(currentStatus, EnumSet.noneOf(BookingStatus.class))
                .contains(newStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(Integer page, Integer size, SortField sortBy, SortDirection direction){
        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        return mapPageToResponse(bookingRepository.findAll(pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id){
        Locale locale = LocaleContextHolder.getLocale();
        Booking booking = bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(messageSource
                .getMessage("error.booking.notfound", null, locale)));
        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        validateBookingDate(request, locale);

        Customer customer = customerRepository.findByIdAndStatus(request.getCustomerId(), AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.customer.notfound", null, locale)));

        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));

        boolean receptionistBooking = isReceptionistRequest();
        List<Room> selectedRooms;
        if (receptionistBooking) {
            validateRoomAvailability(request, null, locale);
            selectedRooms = List.of();
        } else {
            selectedRooms = selectAndLockRooms(request, roomType, locale);
        }

        BigDecimal totalPrice= calculateTotalPrice(roomType, request);

        Booking booking = bookingMapper.toEntity(request);
        booking.setCustomer(customer);
        booking.setRoomType(roomType);
        booking.setRoom(receptionistBooking ? null : selectedRooms.get(0));
        booking.setRooms(receptionistBooking ? new java.util.ArrayList<>() : selectedRooms);
        booking.setBookingStatus(BookingStatus.PENDING_PAYMENT);
        booking.setHoldExpiresAt(receptionistBooking
                ? null
                : LocalDateTime.now().plusMinutes(cartHoldMinutes));
        booking.setPricePerNight(BigDecimal.valueOf(roomType.getBasePrice()));
        booking.setTotalPrice(totalPrice);
        booking.setGuestAllocations(buildGuestAllocations(request, roomType, locale));
        applyStayGuestInfo(booking, request, customer, locale);

        if (!receptionistBooking) {
            selectedRooms.forEach(room -> room.setRoomStatus(RoomStatus.RESERVED));
            roomRepository.saveAll(selectedRooms);
        }

        Booking saved = bookingRepository.save(booking);
        Invoice invoice = Invoice.builder()
                .booking(saved)
                .amount(saved.getTotalPrice())
                .paymentStatus(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        invoiceRepository.save(invoice);
        saved.setInvoice(invoice);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request){
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.booking.notfound", null, locale)));

        if (booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT && booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException(messageSource.getMessage(
                    "error.booking.cannot.update", new Object[]{booking.getBookingStatus()}, locale));
        }

        validateBookingDate(request, locale);

        Customer customer = customerRepository.findByIdAndStatus(request.getCustomerId(), AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.customer.notfound", null, locale)));

        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));

        validateRoomAvailability(request, id, locale);

        BigDecimal totalPrice = calculateTotalPrice(roomType, request);

        bookingMapper.updateBookingFromRequest(request, booking);
        booking.setCustomer(customer);
        booking.setRoomType(roomType);
        booking.setPricePerNight(BigDecimal.valueOf(roomType.getBasePrice()));
        booking.setTotalPrice(totalPrice);
        booking.setGuestAllocations(buildGuestAllocations(request, roomType, locale));
        applyStayGuestInfo(booking, request, customer, locale);

        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBooking(Long id){
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.booking.notfound", null, locale)));

        if (booking.getBookingStatus() == BookingStatus.CHECKED_IN) {
            throw new BadRequestException(messageSource.getMessage(
                    "error.booking.cannot.delete.checkedin", null, locale));
        }
        if (booking.getBookingStatus() == BookingStatus.CHECKED_OUT
                || booking.getBookingStatus() == BookingStatus.CANCELLED
                || booking.getBookingStatus() == BookingStatus.NO_SHOW) {
            throw new BadRequestException(messageSource.getMessage(
                    "error.booking.cannot.delete.terminal", new Object[]{booking.getBookingStatus()}, locale));
        }
        booking.setBookingStatus(BookingStatus.CANCELLED);
        booking.setHoldExpiresAt(null);
        if (booking.getInvoice() != null) {
            booking.getInvoice().setPaymentStatus(PaymentStatus.CANCELLED);
            invoiceRepository.save(booking.getInvoice());
        }
        List<Room> rooms = getAssignedRooms(booking);
        rooms.forEach(room -> room.setRoomStatus(RoomStatus.AVAILABLE));
        roomRepository.saveAll(rooms);
        bookingRepository.save(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> searchBookings(BookingStatus status, Long customerId, Long roomTypeId, Long roomId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", SortDirection.ASC);
        return mapPageToResponse(bookingRepository.searchBookings(status, customerId, roomTypeId, roomId, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookingHistory(String email, Integer page, Integer size) {
        Locale locale = LocaleContextHolder.getLocale();
        Pageable pageable = pageableUtils.createPageable(page, size, "checkInDate", SortDirection.DESC);

        User user = userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));

        return customerRepository.findActiveByEmailOrPhone(user.getEmail(), user.getPhone(), AccountStatus.ACTIVE)
                .map(customer -> mapPageToResponse(bookingRepository.findHistoryByCustomerId(customer.getId(), pageable)))
                .orElseGet(() -> Page.empty(pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size){
        Pageable pageable = pageableUtils.createPageable(page, size, "checkInDate", SortDirection.ASC);
        return mapPageToResponse(bookingRepository.findByCheckInDateBetween(start, end, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size){
        Pageable pageable = pageableUtils.createPageable(page,size, "checkOutDate", SortDirection.ASC);
        return mapPageToResponse(bookingRepository.findByCheckOutDateBetween(start, end, pageable));
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(Long id, BookingStatusRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.booking.notfound", null, locale)));

        BookingStatus currentStatus = booking.getBookingStatus();
        BookingStatus newStatus = request.getStatus();

        if (!isValidTransition(currentStatus, newStatus)) {
            throw new BadRequestException(messageSource.getMessage(
                    "error.booking.invalid.transition",
                    new Object[]{currentStatus, newStatus}, locale));
        }

        booking.setBookingStatus(newStatus);

        // Tạo hoá đơn khi chuyển sang CONFIRMED (nếu chưa có)
        if (newStatus == BookingStatus.CONFIRMED && booking.getInvoice() == null) {
            Invoice invoice = Invoice.builder()
                    .booking(booking)
                    .amount(booking.getTotalPrice())
                    .paymentStatus(PaymentStatus.PENDING)
                    .build();
            invoiceRepository.save(invoice);
        }

        // Lễ tân ấn Check-In khi khách đến -> Chuyển phòng thành OCCUPIED
        if (newStatus == BookingStatus.CHECKED_IN) {
            List<Room> checkinRooms = getAssignedRooms(booking);
            checkinRooms.forEach(room -> room.setRoomStatus(RoomStatus.OCCUPIED));
            roomRepository.saveAll(checkinRooms);
        }

        // Khách Check-Out hoặc quá giờ không đến (No Show) -> Phòng chuyển thành bẩn (DIRTY) để đi dọn
        if (newStatus == BookingStatus.CHECKED_OUT || newStatus == BookingStatus.NO_SHOW) {
            List<Room> rooms = getAssignedRooms(booking);
            rooms.forEach(room -> room.setRoomStatus(RoomStatus.DIRTY));
            roomRepository.saveAll(rooms);
        }

        if (newStatus == BookingStatus.CANCELLED) {
            List<Room> rooms = getAssignedRooms(booking);
            rooms.forEach(room -> room.setRoomStatus(RoomStatus.AVAILABLE));
            roomRepository.saveAll(rooms);
        }

        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public BookingResponse assignRoom(Long bookingId, BookingRoomAssignRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.booking.notfound", null, locale)));

        // [CẬP NHẬT] Đã đóng tiền xong xuôi thành CONFIRMED thì lễ tân mới xếp phòng trước khi khách tới
        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException(messageSource.getMessage(
                    "error.booking.assign.room.not.confirmed", null, locale));
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.room.notfound", null, locale)));

        if (!room.getRoomType().getId().equals(booking.getRoomType().getId())) {
            throw new ConflictException(messageSource.getMessage(
                    "error.booking.room.type.mismatch", null, locale));
        }

        if (room.getRoomStatus() != RoomStatus.AVAILABLE && room.getRoomStatus() != RoomStatus.READY) {
            throw new ConflictException(messageSource.getMessage(
                    "error.booking.room.not.available", null, locale));
        }

        boolean conflict = bookingRepository
                .existsByRoomIdAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                        room.getId(),
                        booking.getCheckOutDate(),
                        booking.getCheckInDate());
        if (conflict) {
            throw new ConflictException(messageSource.getMessage(
                    "error.booking.room.conflict", null, locale));
        }

        booking.setRoom(room);
        booking.setRooms(new java.util.ArrayList<>(List.of(room)));
        room.setRoomStatus(RoomStatus.RESERVED);
        roomRepository.save(room);

        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    private void validateBookingDate(BookingRequest request, Locale locale){
        boolean receptionistBooking = isReceptionistRequest();
        LocalDateTime now = LocalDateTime.now();
        if (receptionistBooking) {
            if (request.getCheckInDate().toLocalDate().isBefore(now.toLocalDate())) {
                throw new ConflictException(messageSource.getMessage("error.booking.checkin.past", null, locale));
            }
        } else {
            if (request.getCheckInDate().isBefore(now)) {
                throw new ConflictException(messageSource.getMessage("error.booking.checkin.past", null, locale));
            }
        }

        if(!request.getCheckOutDate().isAfter(request.getCheckInDate())){
            throw new ConflictException(messageSource.getMessage("error.booking.invalid", null, locale));
        }
    }

    private void validateRoomAvailability(BookingRequest request, Long excludedBookingId, Locale locale){
        long totalActiveRoomCount = roomRepository.countByRoomTypeIdAndRoomStatusNotIn(
                request.getRoomTypeId(),
                List.of(RoomStatus.INACTIVE, RoomStatus.MAINTENANCE)
        );

        long bookedQuantity = bookingRepository.sumBookedQuantityByRoomTypeAndDateRange(
                request.getRoomTypeId(),
                request.getCheckInDate(),
                request.getCheckOutDate(),
                excludedBookingId,
                ROOM_HOLDING_STATUSES
        );
        long remainingQuantity = totalActiveRoomCount - bookedQuantity;

        if (request.getQuantity() > remainingQuantity) {
            String message = messageSource.getMessage(
                    "error.booking.not.enough.rooms",
                    new Object[]{request.getQuantity(), Math.max(remainingQuantity, 0)},
                    locale);
            throw new ConflictException(message);
        }
    }

    private BigDecimal calculateTotalPrice(RoomType roomType, BookingRequest request){
        long nights = ChronoUnit.DAYS.between(request.getCheckInDate().toLocalDate(), request.getCheckOutDate().toLocalDate());
        if (nights <= 0) {
            nights = 1;
        }
        BigDecimal roomCharge = BillingUtils.calculateRoomChargePerNight(BigDecimal.valueOf(roomType.getBasePrice()), nights);
        return roomCharge.multiply(BigDecimal.valueOf(request.getQuantity()));
    }

    private void applyStayGuestInfo(Booking booking, BookingRequest request, Customer customer, Locale locale) {
        boolean bookingForOther = Boolean.TRUE.equals(request.getBookingForOther());
        booking.setBookingForOther(bookingForOther);
        validateCccd(customer.getIdType(), customer.getIdNumberCard(), "booking.booker.cccd.invalid", locale);

        if (!bookingForOther) {
            booking.setGuestFullName(customer.getFullName());
            booking.setGuestEmail(customer.getEmail());
            booking.setGuestPhone(customer.getPhone());
            booking.setGuestIdType(customer.getIdType() == null ? null : customer.getIdType().name());
            booking.setGuestIdNumberCard(customer.getIdNumberCard());
            booking.setGuestNationality(customer.getNationality());
            return;
        }

        validateRequiredGuestInfo(request.getGuestFullName(), "booking.guest.fullname.required", locale);
        validateRequiredGuestInfo(request.getGuestPhone(), "booking.guest.phone.required", locale);
        validateRequiredGuestInfo(request.getGuestIdNumberCard(), "booking.guest.id.required", locale);
        validateCccd(request.getGuestIdType(), request.getGuestIdNumberCard(), "booking.guest.cccd.invalid", locale);

        if (customer.getIdType() == IdType.CCCD
                && "CCCD".equalsIgnoreCase(trimToNull(request.getGuestIdType()))
                && customer.getIdNumberCard().trim().equals(request.getGuestIdNumberCard().trim())) {
            throw new BadRequestException(messageSource.getMessage("booking.cccd.duplicate", null, locale));
        }

        booking.setGuestFullName(trimToNull(request.getGuestFullName()));
        booking.setGuestEmail(trimToNull(request.getGuestEmail()));
        booking.setGuestPhone(trimToNull(request.getGuestPhone()));
        booking.setGuestIdType(trimToNull(request.getGuestIdType()));
        booking.setGuestIdNumberCard(trimToNull(request.getGuestIdNumberCard()));
        booking.setGuestNationality(trimToNull(request.getGuestNationality()));
    }

    private void validateRequiredGuestInfo(String value, String messageKey, Locale locale) {
        if (trimToNull(value) == null) {
            throw new BadRequestException(messageSource.getMessage(messageKey, null, locale));
        }
    }

    private void validateCccd(IdType idType, String idNumberCard, String messageKey, Locale locale) {
        if (idType == IdType.CCCD && (trimToNull(idNumberCard) == null || !idNumberCard.trim().matches(CCCD_PATTERN))) {
            throw new BadRequestException(messageSource.getMessage(messageKey, null, locale));
        }
    }

    private void validateCccd(String idType, String idNumberCard, String messageKey, Locale locale) {
        if ("CCCD".equalsIgnoreCase(trimToNull(idType))
                && (trimToNull(idNumberCard) == null || !idNumberCard.trim().matches(CCCD_PATTERN))) {
            throw new BadRequestException(messageSource.getMessage(messageKey, null, locale));
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Override
    @Transactional(readOnly = true)
    public long checkAvailability(Long roomTypeId, LocalDateTime checkInDate, LocalDateTime checkOutDate) {
        long assignableRoomCount = roomRepository.findRoomsAvailableForCart(
                roomTypeId, checkInDate, checkOutDate, ROOM_HOLDING_STATUSES).size();
        long totalActiveRoomCount = roomRepository.countByRoomTypeIdAndRoomStatusNotIn(
                roomTypeId, List.of(RoomStatus.INACTIVE, RoomStatus.MAINTENANCE));
        long bookedQuantity = bookingRepository.sumBookedQuantityByRoomTypeAndDateRange(
                roomTypeId, checkInDate, checkOutDate, null, ROOM_HOLDING_STATUSES);
        long capacityRemaining = Math.max(0, totalActiveRoomCount - bookedQuantity);
        return Math.min(assignableRoomCount, capacityRemaining);
    }

    private boolean isReceptionistRequest() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_RECEPTIONIST".equals(authority.getAuthority()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableRoomResponseDTO> getAvailableRooms(
            Long roomTypeId, LocalDateTime checkInDate, LocalDateTime checkOutDate) {
        return roomRepository.findRoomsAvailableForCart(
                        roomTypeId, checkInDate, checkOutDate, ROOM_HOLDING_STATUSES)
                .stream()
                .map(room -> AvailableRoomResponseDTO.builder()
                        .id(room.getId())
                        .roomNumber(room.getRoomNumber())
                        .floorNumber(room.getFloorNumber())
                        .roomStatus(room.getRoomStatus())
                        .roomTypeName(room.getRoomType().getTypeName())
                        .build())
                .toList();
    }

    private List<Room> selectAndLockRooms(BookingRequest request, RoomType roomType, Locale locale) {
        int quantity = request.getQuantity();
        List<Room> candidates = roomRepository.findRoomsAvailableForCart(
                roomType.getId(), request.getCheckInDate(), request.getCheckOutDate(), ROOM_HOLDING_STATUSES);
        if (candidates.size() < quantity) {
            throw new ConflictException(messageSource.getMessage(
                    "error.booking.not.enough.rooms", new Object[]{quantity, candidates.size()}, locale));
        }

        List<Room> selected = new java.util.ArrayList<>();
        for (Room candidate : candidates) {
            if (selected.size() == quantity) break;
            Room room = roomRepository.findByIdWithPessimisticWrite(candidate.getId()).orElse(null);
            if (room == null || (room.getRoomStatus() != RoomStatus.AVAILABLE && room.getRoomStatus() != RoomStatus.READY)) {
                continue;
            }
            if (!bookingRepository.existsConflict(room.getId(), request.getCheckOutDate(),
                    request.getCheckInDate(), null, ROOM_HOLDING_STATUSES)) {
                selected.add(room);
            }
        }
        if (selected.size() < quantity) {
            throw new ConflictException(messageSource.getMessage(
                    "error.booking.not.enough.rooms", new Object[]{quantity, selected.size()}, locale));
        }
        return selected;
    }

    private List<Room> getAssignedRooms(Booking booking) {
        if (booking.getRooms() != null && !booking.getRooms().isEmpty()) {
            return booking.getRooms();
        }
        return booking.getRoom() == null ? List.of() : List.of(booking.getRoom());
    }

    private List<RoomGuestAllocation> buildGuestAllocations(
            BookingRequest request, RoomType roomType, Locale locale) {
        if (request.getRoomGuests() == null || request.getRoomGuests().isEmpty()) {
            return new java.util.ArrayList<>(java.util.stream.IntStream.range(0, request.getQuantity())
                    .mapToObj(index -> RoomGuestAllocation.builder()
                            .adults(1).children(0).infants(0).build())
                    .toList());
        }
        if (request.getRoomGuests().size() != request.getQuantity()) {
            throw new BadRequestException(messageSource.getMessage(
                    "error.booking.guest.info.incomplete", null, locale));
        }
        return new java.util.ArrayList<>(request.getRoomGuests().stream().map(guest -> {
            int adults = guest.getAdults() == null ? 1 : guest.getAdults();
            int children = guest.getChildren() == null ? 0 : guest.getChildren();
            int infants = guest.getInfants() == null ? 0 : guest.getInfants();
            if (adults < 1 || children < 0 || infants < 0 || adults + children > roomType.getMaxGuests()) {
                throw new BadRequestException(messageSource.getMessage(
                        "error.booking.guest.capacity.exceeded", null, locale));
            }
            return RoomGuestAllocation.builder()
                    .adults(adults).children(children).infants(infants).build();
        }).toList());
    }
}
