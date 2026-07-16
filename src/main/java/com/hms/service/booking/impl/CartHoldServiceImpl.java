package com.hms.service.booking.impl;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.CartHoldStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.request.CartHoldCheckoutItemRequest;
import com.hms.dto.booking.request.CartHoldCheckoutRequest;
import com.hms.dto.booking.request.CartHoldItemRequest;
import com.hms.dto.booking.request.CartHoldRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.dto.booking.response.CartHoldCheckoutResponse;
import com.hms.dto.booking.response.CartHoldItemResponse;
import com.hms.dto.booking.response.CartHoldResponse;
import com.hms.entity.booking.CartHold;
import com.hms.entity.booking.CartHoldItem;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.CartHoldItemRepository;
import com.hms.repository.booking.CartHoldRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.booking.BookingService;
import com.hms.service.booking.CartHoldService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartHoldServiceImpl implements CartHoldService {

    private static final List<BookingStatus> BOOKING_HOLDING_STATUSES = List.of(
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN);

    private final CartHoldRepository cartHoldRepository;
    private final CartHoldItemRepository cartHoldItemRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final MessageSource messageSource;

    @Value("${app.booking.hold-minutes:1}")
    private long holdMinutes;

    @Override
    @Transactional
    public CartHoldResponse createHold(CartHoldRequest request) {
        CartHold hold = CartHold.builder()
                .holdToken(UUID.randomUUID().toString())
                .status(CartHoldStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(holdMinutes))
                .build();
        cartHoldRepository.save(hold);
        replaceItems(hold, request, LocaleContextHolder.getLocale());
        return toResponse(hold);
    }

    @Override
    @Transactional
    public CartHoldResponse updateHold(String holdToken, CartHoldRequest request) {
        CartHold hold = findLocked(holdToken);
        ensureActive(hold);
        hold.setExpiresAt(LocalDateTime.now().plusMinutes(holdMinutes));
        releaseRooms(hold);
        hold.replaceItems(List.of());
        cartHoldRepository.saveAndFlush(hold);
        replaceItems(hold, request, LocaleContextHolder.getLocale());
        return toResponse(hold);
    }

    @Override
    @Transactional
    public CartHoldResponse getHold(String holdToken) {
        CartHold hold = findLocked(holdToken);
        ensureActive(hold);
        return toResponse(hold);
    }

    @Override
    @Transactional
    public void cancelHold(String holdToken) {
        CartHold hold = findLocked(holdToken);
        if (hold.getStatus() == CartHoldStatus.CANCELLED || hold.getStatus() == CartHoldStatus.EXPIRED) {
            return;
        }
        if (hold.getStatus() == CartHoldStatus.CONVERTED) {
            throw conflict("error.cart.hold.converted");
        }
        releaseRooms(hold);
        hold.setStatus(CartHoldStatus.CANCELLED);
        cartHoldRepository.save(hold);
    }

    @Override
    @Transactional
    public CartHoldCheckoutResponse checkout(String holdToken, CartHoldCheckoutRequest request) {
        CartHold hold = findLocked(holdToken);
        ensureActive(hold);

        Map<Long, CartHoldItem> itemsById = new HashMap<>();
        for (CartHoldItem item : hold.getItems()) {
            itemsById.put(item.getId(), item);
        }
        if (itemsById.size() != request.getItems().size()) {
            throw conflict("error.cart.hold.items.changed");
        }

        Set<Long> submittedIds = new HashSet<>();
        List<BookingResponse> bookings = new ArrayList<>();
        for (CartHoldCheckoutItemRequest checkoutItem : request.getItems()) {
            if (!submittedIds.add(checkoutItem.getHoldItemId())) {
                throw badRequest("error.cart.hold.items.changed");
            }
            CartHoldItem heldItem = itemsById.get(checkoutItem.getHoldItemId());
            if (heldItem == null || Boolean.TRUE.equals(heldItem.getConverted())) {
                throw conflict("error.cart.hold.items.changed");
            }

            BookingRequest bookingRequest = new BookingRequest();
            bookingRequest.setCustomerId(request.getCustomerId());
            bookingRequest.setRoomTypeId(heldItem.getRoomType().getId());
            bookingRequest.setCheckInDate(heldItem.getCheckInDate());
            bookingRequest.setCheckOutDate(heldItem.getCheckOutDate());
            bookingRequest.setQuantity(heldItem.getQuantity());
            bookingRequest.setRoomGuests(checkoutItem.getRoomGuests());
            bookingRequest.setBookingForOther(request.getBookingForOther());
            bookingRequest.setGuestFullName(request.getGuestFullName());
            bookingRequest.setGuestEmail(request.getGuestEmail());
            bookingRequest.setGuestPhone(request.getGuestPhone());
            bookingRequest.setGuestIdType(request.getGuestIdType());
            bookingRequest.setGuestIdNumberCard(request.getGuestIdNumberCard());
            bookingRequest.setGuestNationality(request.getGuestNationality());
            bookingRequest.setCartHoldToken(holdToken);
            bookingRequest.setCartHoldItemId(heldItem.getId());
            bookings.add(bookingService.createBooking(bookingRequest));
        }

        hold.setStatus(CartHoldStatus.CONVERTED);
        cartHoldRepository.save(hold);
        CartHoldCheckoutResponse response = new CartHoldCheckoutResponse();
        response.setBookings(bookings);
        return response;
    }

    @Override
    @Transactional
    public void expireHolds() {
        List<CartHold> expired = cartHoldRepository.findByStatusAndExpiresAtBefore(
                CartHoldStatus.ACTIVE, LocalDateTime.now());
        for (CartHold hold : expired) {
            CartHold locked = cartHoldRepository.findByHoldTokenWithLock(hold.getHoldToken()).orElse(null);
            if (locked == null || locked.getStatus() != CartHoldStatus.ACTIVE
                    || locked.getExpiresAt().isAfter(LocalDateTime.now())) {
                continue;
            }
            releaseRooms(locked);
            locked.setStatus(CartHoldStatus.EXPIRED);
            cartHoldRepository.save(locked);
        }
    }

    private void replaceItems(CartHold hold, CartHoldRequest request, Locale locale) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw badRequest("error.cart.hold.empty");
        }

        List<CartHoldItem> newItems = new ArrayList<>();
        for (CartHoldItemRequest itemRequest : request.getItems()) {
            validateDates(itemRequest, locale);
            RoomType roomType = roomTypeRepository.findByIdAndStatus(
                            itemRequest.getRoomTypeId(), com.hms.common.enums.AccountStatus.ACTIVE)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.roomtype.notfound", null, locale)));
            CartHoldItem item = CartHoldItem.builder()
                    .cartHold(hold)
                    .roomType(roomType)
                    .quantity(itemRequest.getQuantity())
                    .checkInDate(itemRequest.getCheckInDate())
                    .checkOutDate(itemRequest.getCheckOutDate())
                    .rooms(new ArrayList<>())
                    .converted(false)
                    .build();
            item.setRooms(selectAndLockRooms(itemRequest, hold.getId(), newItems, locale));
            newItems.add(item);
        }
        hold.replaceItems(newItems);
        cartHoldRepository.save(hold);
    }

    private List<Room> selectAndLockRooms(
            CartHoldItemRequest request, Long excludedHoldId, List<CartHoldItem> newItems, Locale locale) {
        List<Room> candidates = roomRepository.findRoomsAvailableForCart(
                request.getRoomTypeId(), request.getCheckInDate(), request.getCheckOutDate(),
                BOOKING_HOLDING_STATUSES, null, excludedHoldId);
        List<Room> selected = new ArrayList<>();
        for (Room candidate : candidates) {
            if (selected.size() == request.getQuantity()) {
                break;
            }
            if (newItems.stream().anyMatch(item -> overlaps(item.getCheckInDate(), item.getCheckOutDate(),
                    request.getCheckInDate(), request.getCheckOutDate())
                    && item.getRooms().stream().anyMatch(room -> room.getId().equals(candidate.getId())))) {
                continue;
            }
            Room room = roomRepository.findByIdWithPessimisticWrite(candidate.getId()).orElse(null);
            if (room == null || room.getRoomStatus() == RoomStatus.INACTIVE
                    || room.getRoomStatus() == RoomStatus.MAINTENANCE) {
                continue;
            }
            if (bookingRepository.existsConflict(room.getId(), request.getCheckOutDate(), request.getCheckInDate(),
                    null, BOOKING_HOLDING_STATUSES)) {
                continue;
            }
            if (cartHoldItemRepository.existsActiveConflict(room.getId(), request.getCheckInDate(),
                    request.getCheckOutDate(), excludedHoldId)) {
                continue;
            }
            selected.add(room);
        }
        if (selected.size() < request.getQuantity()) {
            throw new ConflictException(messageSource.getMessage(
                    "error.booking.not.enough.rooms",
                    new Object[] { request.getQuantity(), selected.size() }, locale));
        }
        selected.forEach(room -> room.setRoomStatus(RoomStatus.RESERVED));
        roomRepository.saveAll(selected);
        return selected;
    }

    private void validateDates(CartHoldItemRequest request, Locale locale) {
        LocalDateTime now = LocalDateTime.now();
        if (request.getCheckInDate().isBefore(now) || !request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new ConflictException(messageSource.getMessage("error.booking.invalid", null, locale));
        }
    }

    private boolean overlaps(LocalDateTime firstCheckIn, LocalDateTime firstCheckOut,
            LocalDateTime secondCheckIn, LocalDateTime secondCheckOut) {
        return firstCheckIn.isBefore(secondCheckOut) && secondCheckIn.isBefore(firstCheckOut);
    }

    private CartHold findLocked(String holdToken) {
        if (holdToken == null || holdToken.isBlank()) {
            throw notFound();
        }
        return cartHoldRepository.findByHoldTokenWithLock(holdToken)
                .orElseThrow(this::notFound);
    }

    private void ensureActive(CartHold hold) {
        if (hold.getStatus() != CartHoldStatus.ACTIVE) {
            throw conflict(hold.getStatus() == CartHoldStatus.CONVERTED
                    ? "error.cart.hold.converted" : "error.cart.hold.expired");
        }
        if (!hold.getExpiresAt().isAfter(LocalDateTime.now())) {
            releaseRooms(hold);
            hold.setStatus(CartHoldStatus.EXPIRED);
            cartHoldRepository.save(hold);
            throw conflict("error.cart.hold.expired");
        }
    }

    private void releaseRooms(CartHold hold) {
        Set<Long> roomIds = new HashSet<>();
        List<Room> rooms = new ArrayList<>();
        for (CartHoldItem item : hold.getItems()) {
            for (Room heldRoom : item.getRooms()) {
                if (roomIds.add(heldRoom.getId())) {
                    Room lockedRoom = roomRepository.findByIdWithPessimisticWrite(heldRoom.getId()).orElse(null);
                    if (lockedRoom != null && lockedRoom.getRoomStatus() == RoomStatus.RESERVED) {
                        lockedRoom.setRoomStatus(RoomStatus.AVAILABLE);
                        rooms.add(lockedRoom);
                    }
                }
            }
        }
        roomRepository.saveAll(rooms);
    }

    private CartHoldResponse toResponse(CartHold hold) {
        CartHoldResponse response = new CartHoldResponse();
        response.setHoldToken(hold.getHoldToken());
        response.setStatus(hold.getStatus());
        response.setExpiresAt(hold.getExpiresAt());
        response.setItems(hold.getItems().stream().map(this::toItemResponse).toList());
        return response;
    }

    private CartHoldItemResponse toItemResponse(CartHoldItem item) {
        CartHoldItemResponse response = new CartHoldItemResponse();
        response.setId(item.getId());
        response.setRoomTypeId(item.getRoomType().getId());
        response.setRoomTypeName(item.getRoomType().getTypeName());
        response.setPricePerNight(item.getRoomType().getBasePrice());
        response.setQuantity(item.getQuantity());
        response.setCheckInDate(item.getCheckInDate());
        response.setCheckOutDate(item.getCheckOutDate());
        response.setRoomIds(item.getRooms().stream().map(Room::getId).toList());
        response.setRoomNumbers(item.getRooms().stream().map(Room::getRoomNumber).toList());
        return response;
    }

    private ResourceNotFoundException notFound() {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResourceNotFoundException(messageSource.getMessage("error.cart.hold.notfound", null, locale));
    }

    private ConflictException conflict(String messageKey) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ConflictException(messageSource.getMessage(messageKey, null, locale));
    }

    private BadRequestException badRequest(String messageKey) {
        Locale locale = LocaleContextHolder.getLocale();
        return new BadRequestException(messageSource.getMessage(messageKey, null, locale));
    }
}
