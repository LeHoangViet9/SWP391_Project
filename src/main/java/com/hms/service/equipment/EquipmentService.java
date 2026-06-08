package com.hms.service.equipment;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.EquipmentCheckCreateDTO;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.request.EquipmentImageCreateDTO;
import com.hms.dto.equipment.response.EquipmentCheckResponse;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface EquipmentService {

    Page<EquipmentResponse> getAllEquipments(
            String keywords,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO);

    EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto);

    void deleteEquipment(Long id);

    EquipmentResponse findById(Long id);

    // =========================
    // ADDED: Equipment Images
    // =========================

    EquipmentImageResponse addImage(Long equipmentId, EquipmentImageCreateDTO dto);

    List<EquipmentImageResponse> getImages(Long equipmentId);

    void deleteImage(Long equipmentId, Long imageId);

    // =========================
    // ADDED: Equipment Checks
    // =========================

    EquipmentCheckResponse addCheck(Long equipmentId, EquipmentCheckCreateDTO dto);

    List<EquipmentCheckResponse> getChecks(Long equipmentId);

    void deleteCheck(Long equipmentId, Long checkId);
}