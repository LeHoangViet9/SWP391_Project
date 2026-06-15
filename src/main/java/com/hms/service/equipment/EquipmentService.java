package com.hms.service.equipment;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface EquipmentService {

    Page<EquipmentResponse> getAllEquipments(
            String keywords,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO, MultipartFile file);

    EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto, MultipartFile file);

    void deleteEquipment(Long id);

    EquipmentResponse findById(Long id);
}