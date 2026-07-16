package com.hms.service.equipment.impl;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.equipment.request.AssignEquipmentToRoomDTO;
import com.hms.dto.equipment.request.BulkAssignEquipmentDTO;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.dto.equipment.response.RoomEquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.equipment.EquipmentImage;
import com.hms.entity.equipment.RoomEquipment;
import com.hms.entity.hotel.Room;
import com.hms.repository.equipment.EquipmentImageRepository;
import com.hms.repository.equipment.EquipmentRepository;
import com.hms.repository.equipment.RoomEquipmentRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.maintenance.MaintenanceRepository;
import com.hms.service.equipment.EquipmentService;
import com.hms.service.equipment.mapper.EquipmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Transactional
@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private static final String ERROR_EQUIPMENT_NOTFOUND = "error.equipment.notfound";
    private static final String ERROR_ROOM_NOTFOUND = "error.room.notfound";

    private final EquipmentRepository equipmentRepository;
    private final RoomRepository roomRepository;
    private final RoomEquipmentRepository roomEquipmentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final EquipmentImageRepository equipmentImageRepository;
    private final EquipmentMapper equipmentMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    public Page<EquipmentResponse> getAllEquipments(
            String keyword,
            EquipmentStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    ) {

        Pageable pageable = pageableUtils.createPageable(
                page,
                size,
                sortBy.getField(),
                direction
        );

        return equipmentRepository
                .searchEquipment(keyword, status, pageable)
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

        Equipment savedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(savedEquipment);
    }

    @Override
    public EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(id, locale);

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

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(updatedEquipment);
    }

    @Override
    public void deleteEquipment(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        // Kiểm tra thiết bị có tồn tại và đang ACTIVE
        Equipment equipment = findActiveEquipment(id, locale);

        // ==========================================================
        // Không cho phép xóa nếu thiết bị vẫn đang được gán cho phòng
        // ==========================================================
        if (roomEquipmentRepository.existsByEquipment_Id(id)) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.equipment.assigned",
                            null,
                            locale
                    )
            );
        }

        // ==========================================================
        // Không cho phép xóa nếu thiết bị đang có yêu cầu bảo trì
        // ==========================================================
        if (maintenanceRepository.existsByEquipmentId(id)) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.equipment.in.maintenance",
                            null,
                            locale
                    )
            );
        }

        // ==========================================================
        // Soft Delete: chỉ chuyển trạng thái sang INACTIVE
        // ==========================================================
        equipment.setStatus(EquipmentStatus.INACTIVE);

        equipmentRepository.save(equipment);
    }

    @Override
    public EquipmentResponse findById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(id, locale);

        return equipmentMapper.toResponse(equipment);
    }

    @Override
    public RoomEquipmentResponse assignToRoom(Long equipmentId, AssignEquipmentToRoomDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(equipmentId, locale);

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                ERROR_ROOM_NOTFOUND,
                                new Object[]{dto.getRoomId()},
                                locale
                        )
                ));

        RoomEquipment roomEquipment = roomEquipmentRepository
                .findByRoomIdAndEquipmentId(dto.getRoomId(), equipmentId)
                .orElse(RoomEquipment.builder()
                        .room(room)
                        .equipment(equipment)
                        .build());

        roomEquipment.setQuantity(dto.getQuantity());

        RoomEquipment saved = roomEquipmentRepository.save(roomEquipment);

        return equipmentMapper.toRoomEquipmentResponse(saved);
    }

    @Override
    public void removeFromRoom(Long equipmentId, Long roomId) {
        Locale locale = LocaleContextHolder.getLocale();

        findActiveEquipment(equipmentId, locale);

        RoomEquipment roomEquipment = roomEquipmentRepository
                .findByRoomIdAndEquipmentId(roomId, equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                "error.equipment.not.assigned",
                                null,
                                locale
                        )
                ));

        roomEquipmentRepository.delete(roomEquipment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomEquipmentResponse> getEquipmentsByRoom(Long roomId) {
        return roomEquipmentRepository.findByRoomId(roomId)
                .stream()
                .map(equipmentMapper::toRoomEquipmentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<EquipmentImageResponse> uploadImages(
            Long equipmentId,
            List<MultipartFile> images
    ) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(equipmentId, locale);

        if (images == null || images.isEmpty()) {
            throw new ConflictException(
                    messageSource.getMessage("error.equipment.image.required", null, locale)
            );
        }

        // THAY ĐỔI: Tắt cờ isPrimary (ảnh chính) ở các ảnh cũ
        // để khi lưu ảnh mới, ảnh mới sẽ được làm ảnh chính duy nhất hiển thị trên giao diện
        if (equipment.getImages() != null) {
            for (EquipmentImage img : equipment.getImages()) {
                if (Boolean.TRUE.equals(img.getIsPrimary())) {
                    img.setIsPrimary(false);
                    equipmentImageRepository.save(img);
                }
            }
        }

        List<EquipmentImageResponse> result = new java.util.ArrayList<>();

        try {
            Path uploadPath = Paths.get("uploads/equipments")
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(uploadPath);

            boolean firstImage = true;

            for (MultipartFile image : images) {
                if (image == null || image.isEmpty()) {
                    continue;
                }

                String originalName = image.getOriginalFilename() == null
                        ? "image.jpg"
                        : image.getOriginalFilename();

                originalName = StringUtils.cleanPath(originalName);

                // THAY ĐỔI (Cách 2): Lấy phần mở rộng của file
                String extension = "";
                int dotIndex = originalName.lastIndexOf('.');
                if (dotIndex >= 0) {
                    extension = originalName.substring(dotIndex);
                } else {
                    extension = ".jpg";
                }

                // KIỂM TRA ĐỊNH DẠNG FILE ẢNH HỢP LỆ
                List<String> allowedExtensions = List.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
                if (!allowedExtensions.contains(extension.toLowerCase())) {
                    throw new ConflictException(
                            messageSource.getMessage("error.equipment.image.invalid_extension", new Object[]{allowedExtensions}, locale)
                    );
                }

                // THAY ĐỔI (Cách 2): Đặt tên file gọn gàng theo mã thiết bị và short UUID
                String fileName = equipment.getEquipmentCode().toLowerCase() + "_" 
                        + UUID.randomUUID().toString().substring(0, 8) + extension;

                Path targetPath = uploadPath.resolve(fileName).normalize();

                Files.copy(
                        image.getInputStream(),
                        targetPath,
                        StandardCopyOption.REPLACE_EXISTING
                );

                EquipmentImage equipmentImage = EquipmentImage.builder()
                        .equipment(equipment)
                        .imageUrl("/uploads/equipments/" + fileName)
                        .isPrimary(firstImage)
                        .build();

                EquipmentImage savedImage = equipmentImageRepository.save(equipmentImage);

                result.add(equipmentMapper.toImageResponse(savedImage));

                firstImage = false;
            }

            if (result.isEmpty()) {
                throw new ConflictException(
                        messageSource.getMessage("error.equipment.image.required", null, locale)
                );
            }

            return result;

        } catch (IOException ex) {
            throw new ConflictException(
                    messageSource.getMessage("error.equipment.image.save_failed", null, locale)
            );
        }
    }

    private Equipment findActiveEquipment(Long id, Locale locale) {
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

    // THAY ĐỔI: Triển khai phương thức gán thiết bị theo lô (Bulk Assign) vào phòng
    @Override
    @Transactional
    public List<RoomEquipmentResponse> assignBulkToRoom(Long roomId, List<BulkAssignEquipmentDTO> dtos) {
        Locale locale = LocaleContextHolder.getLocale();

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                ERROR_ROOM_NOTFOUND,
                                new Object[]{roomId},
                                locale
                        )
                ));

        List<RoomEquipmentResponse> result = new java.util.ArrayList<>();

        for (BulkAssignEquipmentDTO dto : dtos) {
            Long equipmentId = dto.getEquipmentId();
            Integer quantity = dto.getQuantity();

            if (quantity == null || quantity < 0) {
                continue;
            }

            Equipment equipment = findActiveEquipment(equipmentId, locale);

            if (quantity == 0) {
                // THAY ĐỔI: Nếu số lượng = 0, thực hiện gỡ thiết bị khỏi phòng (xóa)
                roomEquipmentRepository.findByRoomIdAndEquipmentId(roomId, equipmentId)
                        .ifPresent(roomEquipmentRepository::delete);
            } else {
                // THAY ĐỔI: Nếu số lượng > 0, thực hiện thêm mới hoặc cập nhật số lượng
                RoomEquipment roomEquipment = roomEquipmentRepository
                        .findByRoomIdAndEquipmentId(roomId, equipmentId)
                        .orElse(RoomEquipment.builder()
                                .room(room)
                                .equipment(equipment)
                                .build());

                roomEquipment.setQuantity(quantity);
                RoomEquipment saved = roomEquipmentRepository.save(roomEquipment);
                result.add(equipmentMapper.toRoomEquipmentResponse(saved));
            }
        }

        return result;
    }
}