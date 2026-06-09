package com.hms.service.booking.impl;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.BillingUtils;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.entity.auth.User;
import com.hms.entity.booking.Booking;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.booking.BookingService;
import com.hms.service.booking.mapper.BookingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final List<BookingStatus> ROOM_HOLDING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN
    );

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final BookingMapper bookingMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    public Page<BookingResponse> getAllBookings(Integer page, Integer size, SortField sortBy, SortDirection direction){
        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        return bookingRepository.findAll(pageable).map(bookingMapper::toResponse);
    }

    @Override
    public BookingResponse getBookingById(Long id){
        Locale locale = LocaleContextHolder.getLocale();
        Booking booking = bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(messageSource
                .getMessage("error.booking.notfound", null, locale)));
        return bookingMapper.toResponse(booking);
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

        validateRoomAvailability(request, null, locale);

        BigDecimal totalPrice= calculateTotalPrice(roomType, request);

        Booking booking = bookingMapper.toEntity(request);
        booking.setCustomer(customer);
        booking.setRoomType(roomType);
        booking.setBookingStatus(BookingStatus.PENDING);
        booking.setPricePerNight(roomType.getBasePrice());
        booking.setTotalPrice(totalPrice);

        Booking saved = bookingRepository.save(booking);

        return bookingMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request){
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.booking.notfound", null, locale)));

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
        booking.setPricePerNight(roomType.getBasePrice());
        booking.setTotalPrice(totalPrice);

        Booking updated = bookingRepository.save(booking);
        return bookingMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBooking(Long id){
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.booking.notfound", null, locale)));
        bookingRepository.delete(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> searchBookings(BookingStatus status, Long customerId, Long roomTypeId, Long roomId, Integer page, Integer size) {

        Pageable pageable = pageableUtils.createPageable(page, size, "id", SortDirection.ASC);

        return bookingRepository.searchBookings(status, customerId, roomTypeId, roomId, pageable).map(bookingMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookingHistory(String userName, Integer page, Integer size) {
        Locale locale = LocaleContextHolder.getLocale();
        Pageable pageable = pageableUtils.createPageable(page, size, "checkInDate", SortDirection.DESC);

        User user = userRepository.findUserByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.user.invalid", null, locale)));

        return customerRepository.findActiveByEmailOrPhone(user.getEmail(), user.getPhone(), AccountStatus.ACTIVE)
                .map(customer -> bookingRepository.findHistoryByCustomerId(customer.getId(), pageable)
                        .map(bookingMapper::toResponse))
                .orElseGet(() -> Page.empty(pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsByCheckInDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size){
        Pageable pageable = pageableUtils.createPageable(page, size, "checkInDate", SortDirection.ASC);
        return bookingRepository.findByCheckInDateBetween(start, end, pageable)
                .map(bookingMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsByCheckOutDateBetween(LocalDateTime start, LocalDateTime end, Integer page, Integer size){
        Pageable pageable = pageableUtils.createPageable(page,size, "checkOutDate", SortDirection.ASC);
        return bookingRepository.findByCheckOutDateBetween(start, end, pageable)
                .map(bookingMapper::toResponse);
    }

    private void validateBookingDate(BookingRequest request, Locale locale){
        if(request.getCheckInDate().isBefore(LocalDateTime.now())){
            throw new ConflictException(messageSource.getMessage("error.booking.checkin.past", null, locale));
        }

        if(!request.getCheckOutDate().isAfter(request.getCheckInDate())){
            throw new ConflictException(messageSource.getMessage("error.booking.invalid", null, locale));
        }
    }

    private void validateRoomAvailability(BookingRequest request, Long excludedBookingId, Locale locale){
        long availableRoomCount = roomRepository.countByRoomTypeIdAndRoomStatus(
                request.getRoomTypeId(),
                RoomStatus.AVAILABLE
        );
        long bookedQuantity = bookingRepository.sumBookedQuantityByRoomTypeAndDateRange(
                request.getRoomTypeId(),
                request.getCheckInDate(),
                request.getCheckOutDate(),
                excludedBookingId,
                ROOM_HOLDING_STATUSES
        );
        long remainingQuantity = availableRoomCount - bookedQuantity;

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
        BigDecimal roomCharge = BillingUtils.calculateRoomChargePerNight(roomType.getBasePrice(), nights);
        return roomCharge.multiply(BigDecimal.valueOf(request.getQuantity()));
    }
}
