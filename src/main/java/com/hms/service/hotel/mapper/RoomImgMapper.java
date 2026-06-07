package com.hms.service.hotel.mapper;

import com.hms.dto.roomImg.request.RoomImgRequest;
import com.hms.dto.roomImg.response.RoomImgResponse;
import com.hms.entity.hotel.RoomImage;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoomImgMapper {
    RoomImgRequest toResponse(RoomImage roomImage);

    List<RoomImgResponse> toResponseList(List<RoomImage> roomImages);

    RoomImage toEntity(RoomImgRequest dto);
}
