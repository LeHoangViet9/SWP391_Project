package com.hms.service.equipment.impl;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.equipment.request.EquipmentCheckCreateDTO;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.request.EquipmentImageCreateDTO;
import com.hms.dto.equipment.response.EquipmentCheckResponse;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.auth.User;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.equipment.EquipmentCheck;
import com.hms.entity.equipment.EquipmentImage;
import com.hms.entity.hotel.Room;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.equipment.EquipmentCheckRepository;
import com.hms.repository.equipment.EquipmentImageRepository;
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

import java.util.List;
import java.util.Locale;

@Transactional
@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private static final String ERROR_EQUIPMENT_NOTFOUND = "error.equipment.notfound";
    private static final String ERROR_ROOM_NOTFOUND = "error.room.notfound";

    private final EquipmentRepository equipmentRepository;
    private final EquipmentImageRepository equipmentImageRepository;
    private final EquipmentCheckRepository equipmentCheckRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
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
                .findByEquipmentNameContainingIgnoreCaseAndStatusNot(
                        keywords,
                        EquipmentStatus.INACTIVE,
                        pageable
                )
                .map(equipmentMapper::toResponse);
    }

    @Override
    public EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO) {
        Locale locale = LocaleContextHolder.getLocale();

        if (equipmentRepository.existsByEquipmentCode(
                equipmentDTO.getEquipmentCode()
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

        Equipment equipment = getActiveEquipmentOrThrow(id, locale);

        if (!equipment.getEquipmentCode().equals(dto.getEquipmentCode())
                && equipmentRepository.existsByEquipmentCodeAndIdNot(
                dto.getEquipmentCode(),
                id
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
        } else {
            equipment.setRoom(null);
        }

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(updatedEquipment);
    }

    @Override
    public void deleteEquipment(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = getActiveEquipmentOrThrow(id, locale);

        equipment.setStatus(EquipmentStatus.INACTIVE);
        equipmentRepository.save(equipment);
    }

    @Override
    public EquipmentResponse findById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = getActiveEquipmentOrThrow(id, locale);

        return equipmentMapper.toResponse(equipment);
    }

    // =========================
    // ADDED: Equipment Images
    // =========================

    @Override
    public EquipmentImageResponse addImage(Long equipmentId, EquipmentImageCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = getActiveEquipmentOrThrow(equipmentId, locale);

        Boolean isPrimary = Boolean.TRUE.equals(dto.getIsPrimary());

        // ADDED: nếu ảnh mới là primary thì set các ảnh cũ thành false
        if (isPrimary) {
            List<EquipmentImage> oldImages = equipmentImageRepository.findByEquipment_Id(equipmentId);

            for (EquipmentImage image : oldImages) {
                image.setIsPrimary(false);
            }

            equipmentImageRepository.saveAll(oldImages);
        }

        EquipmentImage image = EquipmentImage.builder()
                .imageUrl(dto.getImageUrl())
                .isPrimary(isPrimary)
                .equipment(equipment)
                .build();

        EquipmentImage savedImage = equipmentImageRepository.save(image);

        return equipmentMapper.toImageResponse(savedImage);
    }

    @Override
    public List<EquipmentImageResponse> getImages(Long equipmentId) {
        Locale locale = LocaleContextHolder.getLocale();

        getActiveEquipmentOrThrow(equipmentId, locale);

        return equipmentImageRepository.findByEquipment_Id(equipmentId)
                .stream()
                .map(equipmentMapper::toImageResponse)
                .toList();
    }

    @Override
    public void deleteImage(Long equipmentId, Long imageId) {
        Locale locale = LocaleContextHolder.getLocale();

        getActiveEquipmentOrThrow(equipmentId, locale);

        EquipmentImage image = equipmentImageRepository.findById(imageId)
                .filter(i -> i.getEquipment().getId().equals(equipmentId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment image not found"
                ));

        equipmentImageRepository.delete(image);
    }

    // =========================
    // ADDED: Equipment Checks
    // =========================

    @Override
    public EquipmentCheckResponse addCheck(Long equipmentId, EquipmentCheckCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = getActiveEquipmentOrThrow(equipmentId, locale);

        User checkedBy = null;

        // ADDED: checkedById có thể null, nhưng nếu gửi lên thì phải tồn tại
        if (dto.getCheckedById() != null) {
            checkedBy = userRepository.findById(dto.getCheckedById())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with id " + dto.getCheckedById()
                    ));
        }

        EquipmentCheck check = EquipmentCheck.builder()
                .equipment(equipment)
                .conditionStatus(dto.getConditionStatus())
                .checkNote(dto.getCheckNote())
                .checkedBy(checkedBy)
                .build();

        EquipmentCheck savedCheck = equipmentCheckRepository.save(check);

        return equipmentMapper.toCheckResponse(savedCheck);
    }

    @Override
    public List<EquipmentCheckResponse> getChecks(Long equipmentId) {
        Locale locale = LocaleContextHolder.getLocale();

        getActiveEquipmentOrThrow(equipmentId, locale);

        return equipmentCheckRepository.findByEquipment_Id(equipmentId)
                .stream()
                .map(equipmentMapper::toCheckResponse)
                .toList();
    }

    @Override
    public void deleteCheck(Long equipmentId, Long checkId) {
        Locale locale = LocaleContextHolder.getLocale();

        getActiveEquipmentOrThrow(equipmentId, locale);

        EquipmentCheck check = equipmentCheckRepository.findById(checkId)
                .filter(c -> c.getEquipment().getId().equals(equipmentId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment check not found"
                ));

        equipmentCheckRepository.delete(check);
    }

    // =========================
    // ADDED: Common helper
    // =========================

    private Equipment getActiveEquipmentOrThrow(Long id, Locale locale) {
        return equipmentRepository.findById(id)
                .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                ERROR_EQUIPMENT_NOTFOUND,
                                new Object[]{id},
                                locale
                        )
                ));
    }
}