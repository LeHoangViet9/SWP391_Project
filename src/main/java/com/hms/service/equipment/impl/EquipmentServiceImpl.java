package com.hms.service.equipment.impl;


import com.hms.common.enums.EquipmentStatus;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.repository.equipment.EquipmentRepository;
import com.hms.service.equipment.EquipmentService;
import com.hms.service.equipment.mapper.EquipmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentMapper equipmentMapper;

    @Override
    public EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO) {
        if (equipmentRepository.existsByEquipmentCode(equipmentDTO.getEquipmentCode())) {
            throw new ConflictException("Equipment code already exists");
        }

        Equipment equipment = equipmentMapper.toEntity(equipmentDTO);
        equipment.setStatus(EquipmentStatus.ACTIVE);

        Equipment savedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(savedEquipment);
    }

    @Override
    public EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));

        if (!equipment.getEquipmentCode().equals(dto.getEquipmentCode())
                && equipmentRepository.existsByEquipmentCode(dto.getEquipmentCode())) {
            throw new ConflictException("Equipment code already exists");
        }

        equipmentMapper.updateEquipmentFromDto(dto, equipment);

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(updatedEquipment);
    }

    @Override
    public void deleteEquipment(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));

        equipment.setStatus(EquipmentStatus.INACTIVE);
        equipmentRepository.save(equipment);
    }

    @Override
    public List<EquipmentResponse> getEquipments() {
        List<Equipment> equipments = equipmentRepository.findByStatus(EquipmentStatus.ACTIVE);

        return equipmentMapper.toResponseList(equipments);
    }

    @Override
    public EquipmentResponse findById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));

        return equipmentMapper.toResponse(equipment);
    }
}