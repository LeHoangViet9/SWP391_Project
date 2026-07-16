package com.hms.service.hotel.mapper;

import com.hms.dto.roomtype.request.RoomTypeRequest;
import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.entity.hotel.RoomType;
import com.hms.entity.hotel.RoomTypeImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import java.util.List;

@Mapper(componentModel = "spring")
public interface RoomTypeMapper {

    @Mapping(target = "images", ignore = true)
    RoomType toEntity(RoomTypeRequest request);

    @Mapping(target = "imageUrl", expression = "java(getFirstImageUrl(roomType))")
    @Mapping(target = "imageUrls", expression = "java(getAllImageUrls(roomType))")
    RoomTypeResponse toResponse(RoomType roomType);

    @Mapping(target = "images", ignore = true)
    void updateRoomTypeFromRequest(RoomTypeRequest request, @MappingTarget RoomType roomType);

    List<RoomTypeResponse> toResponseList(List<RoomType> roomType);

    default String getFirstImageUrl(RoomType roomType) {
        if (roomType.getImages() == null || roomType.getImages().isEmpty()) {
            return null;
        }
        return roomType.getImages().get(0).getImageUrl();
    }

    default List<String> getAllImageUrls(RoomType roomType) {
        if (roomType.getImages() == null || roomType.getImages().isEmpty()) {
            return List.of();
        }
        return roomType.getImages().stream()
                .map(RoomTypeImage::getImageUrl)
                .toList();
    }
}
