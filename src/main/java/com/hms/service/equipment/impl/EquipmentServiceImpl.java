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
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentMapper equipmentMapper;
    private final MessageSource messageSource;

    @Override
    public EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO) {
        Locale locale = LocaleContextHolder.getLocale();
        if (equipmentRepository.existsByEquipmentCode(equipmentDTO.getEquipmentCode())) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.equipment.code.existed",
                            new Object[]{equipmentDTO.getEquipmentCode()},
                            locale
                    )
            );
        }

        Equipment equipment = equipmentMapper.toEntity(equipmentDTO);
        equipment.setStatus(EquipmentStatus.ACTIVE);

        Equipment savedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(savedEquipment);
    }

    @Override
    public EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                "error.equipment.notfound",
                                new Object[]{id},
                                locale
                        )
                ));

        if (!equipment.getEquipmentCode().equals(dto.getEquipmentCode())
                && equipmentRepository.existsByEquipmentCode(dto.getEquipmentCode())) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.equipment.code.existed",
                            new Object[]{dto.getEquipmentCode()},
                            locale
                    )
            );
        }

        equipmentMapper.updateEquipmentFromDto(dto, equipment);

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(updatedEquipment);
    }

    @Override
    public void deleteEquipment(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                "error.equipment.notfound",
                                new Object[]{id},
                                locale
                        )
                ));

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
        Locale locale = LocaleContextHolder.getLocale();
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                "error.equipment.notfound",
                                new Object[]{id},
                                locale
                        )
                ));

        return equipmentMapper.toResponse(equipment);
    }
}