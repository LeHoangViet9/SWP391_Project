package com.hms.service.equipment;

import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;

import java.util.List;

public interface EquipmentService {

    EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO);

    EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto);

    void deleteEquipment(Long id);

    List<EquipmentResponse> getEquipments();

    EquipmentResponse findById(Long id);
}
