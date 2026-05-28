package com.hms.service.hotel;

import java.util.List;

import com.hms.entity.hotel.RoomType;

public interface IRoomTypeService {
    List<RoomType> getAllRoomType();
    RoomType getRoomTypeById(int id);
    RoomType createRoomType(RoomType roomType);
    RoomType updateRoomType(int id, RoomType roomType);
    void deleteRoomTypeByID(int id);
}
