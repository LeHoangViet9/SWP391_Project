package com.hms.service.equipment;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import org.springframework.data.domain.Page;

public interface EquipmentService {

    Page<EquipmentResponse> getAllEquipments(
            Long id,
            String equipmentName,
            String equipmentCode,
            String location,
            Long roomId,
            com.hms.common.enums.EquipmentStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO);

    EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto);

    void deleteEquipment(Long id);

    EquipmentResponse findById(Long id);
}