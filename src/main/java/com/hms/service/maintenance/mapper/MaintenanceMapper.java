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

    RepairRequest toEntity(MaintenanceRequestCreateDTO dto);

    MaintenanceResponse toResponse(RepairRequest repairRequest);

    // Khi cập nhật, bỏ qua các trường null trong DTO để không ghi đè dữ liệu hiện có
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(
            MaintenanceRequestUpdateDTO dto,
            @MappingTarget RepairRequest repairRequest
    );

    List<MaintenanceResponse> toResponseList(
            List<RepairRequest> repairRequests
    );
}