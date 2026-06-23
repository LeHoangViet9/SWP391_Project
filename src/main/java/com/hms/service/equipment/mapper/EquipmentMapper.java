package com.hms.service.equipment.mapper;

import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.dto.equipment.response.RoomEquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.equipment.EquipmentImage;
import com.hms.entity.equipment.RoomEquipment;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface EquipmentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "roomEquipments", ignore = true)
    Equipment toEntity(EquipmentCreateDTO dto);

    @Mapping(source = "roomEquipments", target = "assignedRooms")
    EquipmentResponse toResponse(Equipment equipment);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "roomEquipments", ignore = true)
    void updateEquipmentFromDto(
            EquipmentCreateDTO dto,
            @MappingTarget Equipment equipment
    );

    EquipmentImageResponse toImageResponse(EquipmentImage image);

    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.roomNumber", target = "roomNumber")
    @Mapping(source = "room.roomType.id", target = "roomTypeId")
    @Mapping(source = "room.roomType.typeName", target = "roomTypeName")
    @Mapping(source = "equipment.id", target = "equipmentId")
    @Mapping(source = "equipment.equipmentName", target = "equipmentName")
    @Mapping(source = "equipment.equipmentCode", target = "equipmentCode")
    RoomEquipmentResponse toRoomEquipmentResponse(RoomEquipment roomEquipment);
}