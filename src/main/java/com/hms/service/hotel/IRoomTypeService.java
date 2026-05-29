package com.hms.service.hotel;

import java.util.List;

import com.hms.dto.response.RoomTypeResponse;
import com.hms.dto.roomtype.RoomTypeRequest;
import com.hms.entity.hotel.RoomType;

public interface IRoomTypeService {
    List<RoomTypeResponse> getAllRoomType();
    RoomTypeResponse getRoomTypeById(Long id);
    RoomTypeResponse createRoomType(RoomTypeRequest roomType);
    RoomTypeResponse updateRoomType(Long id, RoomTypeRequest roomType);
    void deleteRoomTypeByID(Long id);
}
