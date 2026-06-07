package com.hms.service.equipment.mapper;

import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentCheckResponse;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.equipment.EquipmentCheck;
import com.hms.entity.equipment.EquipmentImage;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EquipmentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "checks", ignore = true)
    @Mapping(target = "room", ignore = true)
    Equipment toEntity(EquipmentCreateDTO dto);

    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.roomNumber", target = "roomNumber")
    @Mapping(source = "room.roomType.id", target = "roomTypeId")
    @Mapping(source = "room.roomType.typeName", target = "roomTypeName")
    EquipmentResponse toResponse(Equipment equipment);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "checks", ignore = true)
    @Mapping(target = "room", ignore = true)
    void updateEquipmentFromDto(
            EquipmentCreateDTO dto,
            @MappingTarget Equipment equipment
    );


    EquipmentImageResponse toImageResponse(EquipmentImage image);

    @Mapping(source = "checkedBy.id", target = "checkedById")
    @Mapping(source = "checkedBy.fullName", target = "checkedByName")
    EquipmentCheckResponse toCheckResponse(EquipmentCheck check);
}