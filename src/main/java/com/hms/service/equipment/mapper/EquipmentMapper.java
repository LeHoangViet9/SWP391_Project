package com.hms.service.equipment.mapper;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.equipment.Equipment;
import org.mapstruct.Mapper;
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


}