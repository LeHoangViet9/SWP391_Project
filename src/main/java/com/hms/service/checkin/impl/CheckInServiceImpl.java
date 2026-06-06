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
        Room assignedRoom;
        if (request.getRoomId() != null) {
            // Manual assign
            assignedRoom = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));
            
            if (!assignedRoom.getRoomType().getId().equals(booking.getRoomType().getId())) {
                throw new AppException("Assigned room type does not match booking room type", HttpStatus.BAD_REQUEST);
            }
            if (assignedRoom.getRoomStatus() != RoomStatus.AVAILABLE) {
                throw new AppException("Assigned room is not ready. Current status: " + assignedRoom.getRoomStatus(), HttpStatus.UNPROCESSABLE_ENTITY);
            }
        } else {
            // Auto assign if booking already has a room
            if (booking.getRoom() != null) {
                assignedRoom = booking.getRoom();
                if (assignedRoom.getRoomStatus() != RoomStatus.AVAILABLE) {
                    throw new AppException("Previously assigned room is not ready. Status: " + assignedRoom.getRoomStatus(), HttpStatus.UNPROCESSABLE_ENTITY);
                }
            } else {
                // Find an available room of the same type
                List<Room> availableRooms = roomRepository.findByRoomTypeIdAndRoomStatus(booking.getRoomType().getId(), RoomStatus.AVAILABLE);
                if (availableRooms.isEmpty()) {
                    throw new AppException("No available rooms of type " + booking.getRoomType().getTypeName(), HttpStatus.NOT_FOUND);
                }
                assignedRoom = availableRooms.get(0);
            }
        }

        // 4. Update Status
        RoomStatus previousRoomStatus = assignedRoom.getRoomStatus();
        
        booking.setBookingStatus(BookingStatus.CHECKED_IN);
        booking.setRoom(assignedRoom);
        // Note: ERD does not show actual_check_in_time, if you add it, it would be:
        // booking.setActualCheckInTime(now);

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
