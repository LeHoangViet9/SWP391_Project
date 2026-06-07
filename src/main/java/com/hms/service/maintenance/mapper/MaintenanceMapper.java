package com.hms.service.maintenance.mapper;

import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface MaintenanceMapper {

    @Mapping(target = "room", ignore = true)
    @Mapping(target = "equipment", ignore = true)
    @Mapping(target = "reportedBy", ignore = true)
    @Mapping(target = "assignedTo", ignore = true)
    RepairRequest toEntity(MaintenanceRequestCreateDTO dto);

    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.roomNumber", target = "roomNumber")
    @Mapping(source = "equipment.id", target = "equipmentId")
    @Mapping(source = "equipment.equipmentName", target = "equipmentName")
    @Mapping(source = "reportedBy.id", target = "reportedBy")
    @Mapping(source = "reportedBy.fullName", target = "reportedByName")
    @Mapping(source = "assignedTo.id", target = "assignedToId")
    @Mapping(source = "assignedTo.fullName", target = "assignedToName")
    MaintenanceResponse toResponse(RepairRequest repairRequest);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "equipment", ignore = true)
    @Mapping(target = "reportedBy", ignore = true)
    void updateFromDto(
            MaintenanceRequestUpdateDTO dto,
            @MappingTarget RepairRequest repairRequest
    );

    List<MaintenanceResponse> toResponseList(List<RepairRequest> repairRequests);
}