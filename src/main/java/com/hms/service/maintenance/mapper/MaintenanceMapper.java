package com.hms.service.maintenance.mapper;

import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MaintenanceMapper {

    /**
     * Convert MaintenanceRequestCreateDTO thành RepairRequest entity
     */
    RepairRequest toEntity(MaintenanceRequestCreateDTO dto);

    /**
     * Convert RepairRequest entity thành MaintenanceResponse DTO
     */
    MaintenanceResponse toResponse(RepairRequest repairRequest);

    /**
     * Cập nhật RepairRequest từ MaintenanceRequestUpdateDTO
     * Bỏ qua các trường null trong DTO để không ghi đè dữ liệu hiện có
     */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(
            MaintenanceRequestUpdateDTO dto,
            @MappingTarget RepairRequest repairRequest
    );

    /**
     * Convert danh sách RepairRequest entity thành danh sách MaintenanceResponse DTO
     */
    List<MaintenanceResponse> toResponseList(List<RepairRequest> repairRequests);
}