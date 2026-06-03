package com.hms.service.hotel.mapper;

import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import com.hms.entity.hotel.Room;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RoomMapper {

    RoomResponse toResponse(Room room);

    Room toEntity(RoomRequest request);

    void updateRoomFromRequest(RoomRequest request, @MappingTarget Room room);

    List<RoomResponse> toResponseList(List<Room> rooms);
}

