package com.hms.service.hotel.impl;

import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.hotel.IRoomService;
import com.hms.service.hotel.mapper.RoomMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements IRoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomMapper roomMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    public Page<RoomResponse> getAllRooms(String keywords, Integer page, Integer size, SortField sortBy, SortDirection direction) {
        if (keywords == null) {
            keywords = "";
        }

        Pageable pageable = pageableUtils.createPageable(
                page,
                size,
                sortBy.getField(),
                direction
        );
        return roomRepository.findByRoomNumberContainingIgnoreCase(keywords, pageable).map(roomMapper::toResponse);
    }

    @Override
    public RoomResponse getRoomById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));
        return roomMapper.toResponse(room);
    }

    @Override
    public RoomResponse createRoom(RoomRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        // Check if room number already exists
        if (roomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new ConflictException(messageSource.getMessage("error.room.exists", null, locale));
        }

        // Check if room type exists
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));

        Room room = new Room();
        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(roomType);
        room.setRoomStatus(RoomStatus.valueOf(request.getRoomStatus()));
        room.setFloorNumber(request.getFloorNumber());
        room.setDescription(request.getDescription());

        Room saved = roomRepository.save(room);
        return roomMapper.toResponse(saved);
    }

    @Override
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));

        // Check if room number already exists (excluding current room)
        if (roomRepository.existsByRoomNumberAndIdNot(request.getRoomNumber(), id)) {
            throw new ConflictException(messageSource.getMessage("error.room.exists", null, locale));
        }

        // Check if room type exists
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));

        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(roomType);
        room.setRoomStatus(RoomStatus.valueOf(request.getRoomStatus()));
        room.setFloorNumber(request.getFloorNumber());
        room.setDescription(request.getDescription());

        Room updated = roomRepository.save(room);
        return roomMapper.toResponse(updated);
    }

    @Override
    public void deleteRoomByID(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));
        roomRepository.delete(room);
    }

    @Override
    public Page<RoomResponse> getRoomsByStatus(RoomStatus roomStatus, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", SortDirection.ASC);
        return roomRepository.findByRoomStatus(roomStatus, pageable).map(roomMapper::toResponse);
    }

    @Override
    public Page<RoomResponse> getRoomsByFloor(Integer floorNumber, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "roomNumber", SortDirection.ASC);
        return roomRepository.findByFloorNumber(floorNumber, pageable).map(roomMapper::toResponse);
    }

    @Override
    public Page<RoomResponse> getRoomsByRoomType(Long roomTypeId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "roomNumber", SortDirection.ASC);
        return roomRepository.findByRoomTypeId(roomTypeId, pageable).map(roomMapper::toResponse);
    }

    @Override
    public void updateRoomStatus(Long roomId, RoomStatus status) {
        Locale locale = LocaleContextHolder.getLocale();
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));
        room.setRoomStatus(status);
        roomRepository.save(room);
    }
}

