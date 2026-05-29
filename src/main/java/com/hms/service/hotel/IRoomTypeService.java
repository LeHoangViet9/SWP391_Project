package com.hms.service.hotel;

import java.util.List;

import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.dto.roomtype.request.RoomTypeRequest;

public interface IRoomTypeService {
    List<RoomTypeResponse> getAllRoomType();
    RoomTypeResponse getRoomTypeById(Long id);
    RoomTypeResponse createRoomType(RoomTypeRequest roomType);
    RoomTypeResponse updateRoomType(Long id, RoomTypeRequest roomType);
    void deleteRoomTypeByID(Long id);
}
