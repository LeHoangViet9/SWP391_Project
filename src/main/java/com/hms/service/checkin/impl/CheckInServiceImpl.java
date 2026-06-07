package com.hms.service.checkin.impl;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.ProcessTrigger;
import com.hms.common.enums.RoomStatus;
import com.hms.common.exception.AppException;
import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;
import com.hms.entity.auth.User;
import com.hms.entity.booking.Booking;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomStateHistory;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomStateHistoryRepository;
import com.hms.service.checkin.CheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckInServiceImpl implements CheckInService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final RoomStateHistoryRepository roomStateHistoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CheckInResponseDTO processCheckIn(CheckInRequestDTO request, Long userId) {
        // 1. Verify Booking
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new AppException("Booking not found", HttpStatus.NOT_FOUND));

        if (booking.getBookingStatus() == BookingStatus.CHECKED_IN) {
            throw new AppException("Booking is already checked in", HttpStatus.CONFLICT);
        }

        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new AppException("Booking must be CONFIRMED before check-in. Current status: " + booking.getBookingStatus(), HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // 2. Validate Time (Basic validation: Check-in date should not be in the future beyond today)
        LocalDateTime now = LocalDateTime.now();
        if (now.toLocalDate().isBefore(booking.getCheckInDate().toLocalDate())) {
            throw new AppException("Too early to check in. Check-in date is " + booking.getCheckInDate().toLocalDate(), HttpStatus.BAD_REQUEST);
        }

        // 3. Assign Room
        // Find an available room of the same type avoiding overlap
        List<Room> availableRooms = roomRepository.findAvailableRoomsForDateRange(
                booking.getRoomType().getId(), 
                RoomStatus.AVAILABLE, 
                booking.getCheckInDate(), 
                booking.getCheckOutDate(),
                List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN)
        );
        
        if (availableRooms.isEmpty()) {
            throw new AppException("No available rooms of type " + booking.getRoomType().getTypeName() + " for this date range", HttpStatus.NOT_FOUND);
        }
        Long selectedRoomId = availableRooms.get(0).getId();

        // 4. Lock and Double Check
        Room assignedRoom = roomRepository.findByIdWithPessimisticWrite(selectedRoomId)
                .orElseThrow(() -> new AppException("Room not found during lock phase", HttpStatus.NOT_FOUND));

        if (assignedRoom.getRoomStatus() != RoomStatus.AVAILABLE) {
            throw new AppException("Room " + assignedRoom.getRoomNumber() + " is no longer available. Current status: " + assignedRoom.getRoomStatus(), HttpStatus.CONFLICT);
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
            throw new AppException("Room " + assignedRoom.getRoomNumber() + " is already booked for this date range.", HttpStatus.CONFLICT);
        }

        // 5. Update Status
        RoomStatus previousRoomStatus = assignedRoom.getRoomStatus();
        
        booking.setBookingStatus(BookingStatus.CHECKED_IN);
        booking.setRoom(assignedRoom);

        assignedRoom.setRoomStatus(RoomStatus.OCCUPIED);

        bookingRepository.save(booking);
        roomRepository.save(assignedRoom);

        // 5. Audit Log (RoomStateHistory)
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

        // 6. Return Response
        return CheckInResponseDTO.builder()
                .bookingId(booking.getId())
                .customerName(booking.getCustomer().getFullName())
                .roomNumber(assignedRoom.getRoomNumber())
                .bookingStatus(booking.getBookingStatus())
                .checkInTime(now)
                .message("Check-in successful")
                .build();
    }
}
