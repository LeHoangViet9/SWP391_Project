package com.hms.service.maintenance.mapper;

import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface MaintenanceMapper {

    // 1. Chuyển từ DTO Create sang Entity (Bỏ qua Object để Service tự set bằng ID)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "equipment", ignore = true)
    @Mapping(target = "assignedTo", ignore = true)
    RepairRequest toEntity(MaintenanceRequestCreateDTO dto);

    // 2. Chuyển từ Entity sang Response (Phẳng hóa Object thành các trường ID và Name)
    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.roomNumber", target = "roomNumber")

    @Mapping(source = "equipment.id", target = "equipmentId")
    @Mapping(source = "equipment.equipmentName", target = "equipmentName")
    @Mapping(source = "assignedTo.id", target = "assignedToId")
    @Mapping(source = "assignedTo.fullName", target = "assignedToName")
    MaintenanceResponse toResponse(RepairRequest repairRequest);

    // 3. Khi cập nhật, giữ nguyên chiến lược IGNORE trường null của bạn
    // Nhưng bắt buộc phải IGNORE thêm trường assignedTo để không bị lỗi lệch kiểu Long vs User
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "equipment", ignore = true)
    void updateFromDto(
            MaintenanceRequestUpdateDTO dto,
            @MappingTarget RepairRequest repairRequest
    );

}