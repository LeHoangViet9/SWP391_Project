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

    // Map trực tiếp từ danh sách object RoomImage sang danh sách String URL
    @Mapping(target = "imageUrls", expression = "java(getAllImageUrls(room.getRoomImages()))")
    RoomResponse toResponse(Room room);

    // ... các phương thức khác

    default List<String> getAllImageUrls(List<RoomImage> roomImages) {
        if (roomImages == null || roomImages.isEmpty()) {
            return null;
        }
        // Dùng Java Stream để trích xuất URL từ các object RoomImage
        return roomImages.stream()
                .map(RoomImage::getImageUrl)
                .collect(java.util.stream.Collectors.toList());
    }
}

