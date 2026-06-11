package com.hms.service.equipment.mapper;

import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentCheckResponse;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.dto.equipment.response.RoomEquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.equipment.EquipmentCheck;
import com.hms.entity.equipment.EquipmentImage;
import com.hms.entity.equipment.RoomEquipment;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface EquipmentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)

    // GIỮ: images/checks không lấy từ DTO create
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "checks", ignore = true)

    // SỬA: bỏ room vì Equipment.java không còn field room nữa
    // THÊM: ignore roomEquipments vì gán phòng sẽ qua màn hình riêng
    @Mapping(target = "roomEquipments", ignore = true)
    Equipment toEntity(EquipmentCreateDTO dto);

    // SỬA:
    // Trước đây map room.id -> roomId.
    // Bây giờ Equipment không thuộc 1 phòng trực tiếp nữa.
    // roomEquipments sẽ trả về assignedRooms.
    @Mapping(source = "roomEquipments", target = "assignedRooms")
    EquipmentResponse toResponse(Equipment equipment);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)

    // GIỮ: không update images/checks ở update equipment
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "checks", ignore = true)

    // SỬA: bỏ room, thay bằng roomEquipments
    @Mapping(target = "roomEquipments", ignore = true)
    void updateEquipmentFromDto(
            EquipmentCreateDTO dto,
            @MappingTarget Equipment equipment
    );

    // GIỮ: map ảnh thiết bị
    EquipmentImageResponse toImageResponse(EquipmentImage image);

    // GIỮ: map lịch sử kiểm tra thiết bị
    @Mapping(source = "checkedBy.id", target = "checkedById")
    @Mapping(source = "checkedBy.fullName", target = "checkedByName")
    EquipmentCheckResponse toCheckResponse(EquipmentCheck check);

    // THÊM MỚI:
    // Map bảng trung gian RoomEquipment ra response để frontend hiển thị
    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.roomNumber", target = "roomNumber")
    @Mapping(source = "room.roomType.id", target = "roomTypeId")
    @Mapping(source = "room.roomType.typeName", target = "roomTypeName")
    @Mapping(source = "equipment.id", target = "equipmentId")
    @Mapping(source = "equipment.equipmentName", target = "equipmentName")
    @Mapping(source = "equipment.equipmentCode", target = "equipmentCode")
    RoomEquipmentResponse toRoomEquipmentResponse(RoomEquipment roomEquipment);
}