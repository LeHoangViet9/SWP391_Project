package com.hms.service.hotel.mapper;

import com.hms.dto.roomtype.request.RoomTypeRequest;
import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.entity.hotel.RoomType;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import java.util.List;

@Mapper(componentModel = "spring")
public interface RoomTypeMapper {

    RoomType toEntity(RoomTypeRequest request);

    RoomTypeResponse toResponse(RoomType roomType);

    void updateRoomTypeFromRequest(RoomTypeRequest request, @MappingTarget RoomType roomType);

    List<RoomTypeResponse> toResponseList(List<RoomType> roomType);
}
