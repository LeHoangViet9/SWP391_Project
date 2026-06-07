package com.hms.service.equipment.mapper;

import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentCheckResponse;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.equipment.EquipmentCheck;
import com.hms.entity.equipment.EquipmentImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EquipmentMapper {
    Equipment toEntity(EquipmentCreateDTO dto);

    EquipmentResponse toResponse(Equipment equipment);

    void updateEquipmentFromDto(
            EquipmentCreateDTO dto,
            @MappingTarget Equipment equipment
    );

    List<EquipmentResponse> toResponseList(List<Equipment> equipments);

    EquipmentImageResponse toImageResponse(EquipmentImage image);

    @Mapping(source = "checkedBy.id", target = "checkedById")
    @Mapping(source = "checkedBy.fullName", target = "checkedByName")
    EquipmentCheckResponse toCheckResponse(EquipmentCheck check);

}