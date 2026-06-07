package com.hms.service.equipment.impl;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.hotel.Room;
import com.hms.repository.equipment.EquipmentRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.service.equipment.EquipmentService;
import com.hms.service.equipment.mapper.EquipmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Transactional
@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private static final String ERROR_EQUIPMENT_NOTFOUND = "error.equipment.notfound";
    private static final String ERROR_ROOM_NOTFOUND = "error.room.notfound";

    private final EquipmentRepository equipmentRepository;
    private final RoomRepository roomRepository;
    private final EquipmentMapper equipmentMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    public Page<EquipmentResponse> getAllEquipments(
            String keywords,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        if (keywords == null) {
            keywords = "";
        } else {
            keywords = keywords.trim();
        }

        Pageable pageable = pageableUtils.createPageable(
                page,
                size,
                sortBy.getField(),
                direction
        );

        return equipmentRepository
                .findByEquipmentNameContainingIgnoreCaseAndStatus(
                        keywords,
                        EquipmentStatus.ACTIVE,
                        pageable
                )
                .map(equipmentMapper::toResponse);
    }

    @Override
    public EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO) {
        Locale locale = LocaleContextHolder.getLocale();

        if (equipmentRepository.existsByEquipmentCodeAndStatus(
                equipmentDTO.getEquipmentCode(),
                EquipmentStatus.ACTIVE
        )) {
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

        if (equipmentDTO.getRoomId() != null) {
            Room room = roomRepository.findById(equipmentDTO.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage(
                                    ERROR_ROOM_NOTFOUND,
                                    new Object[]{equipmentDTO.getRoomId()},
                                    locale
                            )
                    ));

            equipment.setRoom(room);
        }

        Equipment savedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(savedEquipment);
    }

    @Override
    public EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = equipmentRepository.findById(id)
                .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                ERROR_EQUIPMENT_NOTFOUND,
                                new Object[]{id},
                                locale
                        )
                ));

        if (!equipment.getEquipmentCode().equals(dto.getEquipmentCode())
                && equipmentRepository.existsByEquipmentCodeAndIdNotAndStatus(
                dto.getEquipmentCode(),
                id,
                EquipmentStatus.ACTIVE
        )) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.equipment.code.existed",
                            new Object[]{dto.getEquipmentCode()},
                            locale
                    )
            );
        }

        equipmentMapper.updateEquipmentFromDto(dto, equipment);

        if (dto.getRoomId() != null) {
            Room room = roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage(
                                    ERROR_ROOM_NOTFOUND,
                                    new Object[]{dto.getRoomId()},
                                    locale
                            )
                    ));

            equipment.setRoom(room);
        }

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(updatedEquipment);
    }

    @Override
    public void deleteEquipment(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = equipmentRepository.findById(id)
                .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                ERROR_EQUIPMENT_NOTFOUND,
                                new Object[]{id},
                                locale
                        )
                ));

        equipment.setStatus(EquipmentStatus.INACTIVE);
        equipmentRepository.save(equipment);
    }

    @Override
    public EquipmentResponse findById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = equipmentRepository.findById(id)
                .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                ERROR_EQUIPMENT_NOTFOUND,
                                new Object[]{id},
                                locale
                        )
                ));

        return equipmentMapper.toResponse(equipment);
    }
}