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
    @Mapping(source = "assignedTo.id",        target = "assignedToId")
    @Mapping(source = "assignedTo.fullName",  target = "assignedToName")
    @Mapping(source = "assignedBy.id",        target = "assignedById")
    @Mapping(source = "assignedBy.fullName",  target = "assignedByName")
    HouseKeepingTaskResponse toResponse(HouseKeepingTask task);

    List<HouseKeepingTaskResponse> toResponseList(List<HouseKeepingTask> tasks);
}