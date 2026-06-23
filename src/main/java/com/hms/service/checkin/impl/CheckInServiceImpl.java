package com.hms.service.checkin.impl;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.ProcessTrigger;
import com.hms.common.enums.RoomStatus;
import com.hms.common.exception.ConflictException;
import com.hms.dto.checkin.request.CheckInRequestDTO;
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

        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.booking.status.invalid",
                            new Object[]{booking.getBookingStatus()},
                            locale
                    )
            );
        }

        // 2. Validate Time (Basic validation: Check-in date should not be in the future beyond today)
        LocalDateTime now = LocalDateTime.now();
        if (now.toLocalDate().isBefore(booking.getCheckInDate().toLocalDate())) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.too.early",
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

        if (assignedRoom.getRoomStatus() != RoomStatus.AVAILABLE) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.checkin.room.not.available",
                            new Object[]{assignedRoom.getRoomNumber(), assignedRoom.getRoomStatus()},
                            locale
                    )
            );
        }

        // Double check overlap after acquiring lock
        boolean isOverlapping = bookingRepository.existsOverlappingBooking(
                assignedRoom.getId(),
                booking.getId(),
                List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN),
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
        RoomStatus previousRoomStatus = assignedRoom.getRoomStatus();

        booking.setBookingStatus(BookingStatus.CHECKED_IN);
        booking.setRoom(assignedRoom);
        booking.setActualCheckInTime(now);

        assignedRoom.setRoomStatus(RoomStatus.OCCUPIED);

        bookingRepository.save(booking);
        roomRepository.save(assignedRoom);

        // 6. Audit Log (RoomStateHistory)
        User triggerUser = null;
        if (userId != null) {
            triggerUser = userRepository.findById(userId).orElse(null);
        }

        RoomStateHistory history = RoomStateHistory.builder()
                .room(assignedRoom)
                .previousState(previousRoomStatus)
                .currentState(RoomStatus.OCCUPIED)
                .triggeredByProcess(ProcessTrigger.CHECKIN)
                .triggeredByUser(triggerUser)
                .build();

        roomStateHistoryRepository.save(history);

        // 7. Return Response
        return CheckInResponseDTO.builder()
                .bookingId(booking.getId())
                .customerName(booking.getCustomer().getFullName())
                .roomNumber(assignedRoom.getRoomNumber())
                .bookingStatus(booking.getBookingStatus())
                .checkInTime(now)
                .message("Check-in successful")
                .build();
    }

    @Override
    public List<Room> getAvailableRoomsForBooking(Long bookingId) {
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
        );
    }
}
