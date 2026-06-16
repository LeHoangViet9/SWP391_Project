package com.hms.service.hotel.mapper;

import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RoomMapper {

    @Mapping(target = "imageRoom", expression = "java(getFirstImageUrl(room))")
    @Mapping(target = "imageRooms", expression = "java(getAllImageUrls(room))")
    RoomResponse toResponse(Room room);

    Room toEntity(RoomRequest request);

    void updateRoomFromRequest(RoomRequest request, @MappingTarget Room room);

    List<RoomResponse> toResponseList(List<Room> rooms);

    default String getFirstImageUrl(Room room) {
        if (room.getRoomImages() == null || room.getRoomImages().isEmpty()) {
            return null;
        }
        return room.getRoomImages().get(0).getImageUrl();
    }

    default List<String> getAllImageUrls(Room room) {
        if (room.getRoomImages() == null || room.getRoomImages().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return room.getRoomImages().stream()
                .map(RoomImage::getImageUrl)
                .collect(java.util.stream.Collectors.toList());
    }
}

