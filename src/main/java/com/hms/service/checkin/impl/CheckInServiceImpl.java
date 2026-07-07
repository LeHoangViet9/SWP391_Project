package com.hms.service.checkin.impl;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.ProcessTrigger;
import com.hms.common.enums.RoomStatus;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.AvailableRoomResponseDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;
import com.hms.entity.auth.User;
import com.hms.entity.booking.Booking;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomStateHistory;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.housekeeping.RoomStateHistoryRepository;
import com.hms.service.checkin.CheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CheckInServiceImpl implements CheckInService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final RoomStateHistoryRepository roomStateHistoryRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;

    @Override
    @Transactional
    public CheckInResponseDTO processCheckIn(CheckInRequestDTO request, Long userId) {
        Locale locale = LocaleContextHolder.getLocale();

        // 1. Verify Booking
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ConflictException(
                        messageSource.getMessage(
                                "error.checkin.booking.notfound",
                                new Object[]{request.getBookingId()},
                                locale
                        )
                ));

        if (booking.getBookingStatus() == BookingStatus.CHECKED_IN) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.booking.already.checked.in",
                            new Object[]{booking.getId()},
                            locale
                    )
            );
        }

        if (booking.getBookingStatus() != BookingStatus.PENDING_CHECK_IN) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.booking.status.invalid",
                            new Object[]{booking.getBookingStatus()},
                            locale
                    )
            );
        }

        verifyStayGuestInfoBeforeCheckIn(booking, request, locale);

        // Check-in is allowed from 14:00 on the booked check-in date.
        LocalDateTime now = LocalDateTime.now();
        if (now.toLocalDate().isBefore(booking.getCheckInDate().toLocalDate())
                || (now.toLocalDate().isEqual(booking.getCheckInDate().toLocalDate())
                && now.toLocalTime().isBefore(LocalTime.of(14, 0)))) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.before.standard.time",
                            new Object[]{booking.getCheckInDate().toLocalDate()},
                            locale
                    )
            );
        }

        // 3. Assign Room
        Long selectedRoomId = request.getRoomId();
        if (selectedRoomId == null) {
            // Find an available room of the same type avoiding overlap
            List<Room> availableRooms = roomRepository.findAvailableRoomsForCheckIn(
                    booking.getRoomType().getId(),
                    booking.getCheckInDate(),
                    booking.getCheckOutDate()
            );

            if (availableRooms.isEmpty()) {
                throw new ConflictException(
                        messageSource.getMessage(
                                "error.checkin.no.available.rooms",
                                new Object[]{booking.getRoomType().getTypeName()},
                                locale
                        )
                );
            }
            selectedRoomId = availableRooms.get(0).getId();
        }

        // 4. Lock and Double Check
        final Long roomIdToLock = selectedRoomId;
        Room assignedRoom = roomRepository.findByIdWithPessimisticWrite(roomIdToLock)
                .orElseThrow(() -> new ConflictException(
                        messageSource.getMessage(
                                "error.checkin.room.notfound.lock",
                                new Object[]{roomIdToLock},
                                locale
                        )
                ));

        if (!canUseRoomForCheckIn(booking, assignedRoom)) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.room.not.available",
                            new Object[]{assignedRoom.getRoomNumber(), assignedRoom.getRoomStatus()},
                            locale
                    )
            );
        }

        boolean isOverlapping = bookingRepository.existsOverlappingBooking(
                assignedRoom.getId(),
                booking.getId(),
                List.of(BookingStatus.PENDING_CHECK_IN, BookingStatus.CHECKED_IN),
                booking.getCheckInDate(),
                booking.getCheckOutDate()
        );

        if (isOverlapping) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.room.overlap",
                            new Object[]{assignedRoom.getRoomNumber()},
                            locale
                    )
            );
        }

        // 5. Update Status
        List<Room> assignedRooms = booking.getRooms() != null && !booking.getRooms().isEmpty()
                ? booking.getRooms()
                : List.of(assignedRoom);

        booking.setBookingStatus(BookingStatus.CHECKED_IN);
        booking.setRoom(assignedRoom);
        booking.setActualCheckInTime(now);

        assignedRooms.forEach(room -> room.setRoomStatus(RoomStatus.OCCUPIED));

        bookingRepository.save(booking);
        roomRepository.saveAll(assignedRooms);

        // 6. Audit Log (RoomStateHistory)
        User triggerUser = null;
        if (userId != null) {
            triggerUser = userRepository.findById(userId).orElse(null);
        }

        final User historyUser = triggerUser;
        assignedRooms.forEach(room -> roomStateHistoryRepository.save(RoomStateHistory.builder()
                .room(room)
                .previousState(RoomStatus.RESERVED)
                .currentState(RoomStatus.OCCUPIED)
                .triggeredByProcess(ProcessTrigger.CHECKIN)
                .triggeredByUser(historyUser)
                .build()));

        // 7. Return Response
        return CheckInResponseDTO.builder()
                .bookingId(booking.getId())
                .customerName(booking.getCustomer().getFullName())
                .roomNumber(assignedRoom.getRoomNumber())
                .bookingStatus(booking.getBookingStatus())
                .checkInTime(now)
                .message("Check-in successful")
                .bookingForOther(booking.getBookingForOther())
                .guestFullName(booking.getGuestFullName())
                .guestPhone(booking.getGuestPhone())
                .guestIdNumberCard(booking.getGuestIdNumberCard())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableRoomResponseDTO> getAvailableRoomsForBooking(Long bookingId) {
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ConflictException(
                        messageSource.getMessage(
                                "error.checkin.booking.notfound",
                                new Object[]{bookingId},
                                locale
                        )
                ));

        return roomRepository.findAvailableRoomsForCheckIn(
                        booking.getRoomType().getId(),
                        booking.getCheckInDate(),
                        booking.getCheckOutDate()
                )
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

    private void verifyStayGuestInfoBeforeCheckIn(Booking booking, CheckInRequestDTO request, Locale locale) {
        updateGuestInfoIfProvided(booking, request);

        if (Boolean.TRUE.equals(booking.getBookingForOther()) && !Boolean.TRUE.equals(request.getGuestInfoConfirmed())) {
            throw new BadRequestException(
                    messageSource.getMessage("error.checkin.guest.confirmation.required", null, locale)
            );
        }

        if (isBlank(booking.getGuestFullName())
                || isBlank(booking.getGuestPhone())
                || isBlank(booking.getGuestIdNumberCard())) {
            throw new BadRequestException(
                    messageSource.getMessage("error.checkin.guest.info.required", null, locale)
            );
        }
    }

    private void updateGuestInfoIfProvided(Booking booking, CheckInRequestDTO request) {
        if (hasText(request.getGuestFullName())) {
            booking.setGuestFullName(request.getGuestFullName().trim());
        }
        if (hasText(request.getGuestEmail())) {
            booking.setGuestEmail(request.getGuestEmail().trim());
        }
        if (hasText(request.getGuestPhone())) {
            booking.setGuestPhone(request.getGuestPhone().trim());
        }
        if (hasText(request.getGuestIdType())) {
            booking.setGuestIdType(request.getGuestIdType().trim());
        }
        if (hasText(request.getGuestIdNumberCard())) {
            booking.setGuestIdNumberCard(request.getGuestIdNumberCard().trim());
        }
        if (hasText(request.getGuestNationality())) {
            booking.setGuestNationality(request.getGuestNationality().trim());
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean canUseRoomForCheckIn(Booking booking, Room room) {
        if (room.getRoomStatus() == RoomStatus.AVAILABLE || room.getRoomStatus() == RoomStatus.READY) {
            return true;
        }
        return room.getRoomStatus() == RoomStatus.RESERVED
                && booking.getRoom() != null
                && room.getId().equals(booking.getRoom().getId());
    }
}
