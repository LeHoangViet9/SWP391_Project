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
    // BỔ SUNG ĐẢM BẢO MAP CHUẨN SANG RESPONSE (Nếu tên thuộc tính ở DTO Response khớp hoàn toàn thì MapStruct tự map, nhưng khai báo ở đây cho chắc chắn)
    @Mapping(source = "diagnosis", target = "diagnosis")
    @Mapping(source = "repairResult", target = "repairResult")
    MaintenanceResponse toResponse(RepairRequest repairRequest);

    // 3. Khi cập nhật, giữ nguyên chiến lược IGNORE trường null của bạn
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "equipment", ignore = true)
    // BỔ SUNG: Cho phép MapStruct tự động cập nhật 2 trường này từ DTO Update vào Entity
    @Mapping(source = "diagnosis", target = "diagnosis")
    @Mapping(source = "repairResult", target = "repairResult")
    void updateFromDto(
            MaintenanceRequestUpdateDTO dto,
            @MappingTarget RepairRequest repairRequest
    );
}