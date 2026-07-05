package com.hms.service.housekeeping.mapper;

import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.entity.housekeeping.HouseKeepingTask;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface HouseKeepingTaskMapper {

    @Mapping(source = "room.id",             target = "roomId")
    @Mapping(source = "room.roomNumber",      target = "roomNumber")
    @Mapping(source = "room.roomStatus",      target = "roomState")
    @Mapping(source = "assignedTo.id",        target = "assignedToId")
    @Mapping(source = "assignedTo.fullName",  target = "assignedToName")
    @Mapping(source = "assignedTo.workStatus", target = "assignedToWorkStatus")
    @Mapping(source = "assignedBy.id",        target = "assignedById")
    @Mapping(source = "assignedBy.fullName",  target = "assignedByName")
    // FIX: Đảm bảo các thuộc tính thời gian mới thêm ở Entity (createdAt, updatedAt)
    // tự động mapping chính xác sang DTO Response mà không bị bỏ sót khi Reflection chạy ngầm.
    @Mapping(source = "createdAt",            target = "createdAt")
    @Mapping(source = "updatedAt",            target = "updatedAt")
    HouseKeepingTaskResponse toResponse(HouseKeepingTask task);

    List<HouseKeepingTaskResponse> toResponseList(List<HouseKeepingTask> tasks);
}
