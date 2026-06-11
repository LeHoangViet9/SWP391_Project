package com.hms.service.equipment.impl;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.equipment.request.AssignEquipmentToRoomDTO;
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

    // THÊM MỚI: repository cho bảng room_equipments
    private final RoomEquipmentRepository roomEquipmentRepository;

    // THÊM MỚI: repository cho bảng equipment_images
    private final EquipmentImageRepository equipmentImageRepository;

    private final EquipmentMapper equipmentMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override

    public Page<EquipmentResponse> getAllEquipments(
            Long id,
            String equipmentName,
            String equipmentCode,

            Long roomId,
            EquipmentStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        List<Equipment> list = equipmentRepository.findAll();
        java.util.stream.Stream<Equipment> stream = list.stream();

        if (id != null) {
            stream = stream.filter(e -> e.getId().equals(id));
        }

        if (StringUtils.hasText(equipmentName)) {
            String cleanName = equipmentName.trim().toLowerCase();
            stream = stream.filter(e ->
                    e.getEquipmentName() != null
                            && e.getEquipmentName().toLowerCase().contains(cleanName)
            );
        }

        if (StringUtils.hasText(equipmentCode)) {
            String cleanCode = equipmentCode.trim().toLowerCase();
            stream = stream.filter(e ->
                    e.getEquipmentCode() != null
                            && e.getEquipmentCode().toLowerCase().contains(cleanCode)
            );
        }



        // SỬA:
        // Equipment không còn e.getRoom().
        // Nếu muốn filter theo phòng, kiểm tra trong danh sách roomEquipments.
        if (roomId != null) {
            stream = stream.filter(e ->
                    e.getRoomEquipments() != null
                            && e.getRoomEquipments().stream()
                            .anyMatch(re -> re.getRoom() != null
                                    && re.getRoom().getId().equals(roomId))
            );
        }

        if (status != null) {
            stream = stream.filter(e -> e.getStatus() == status);
        } else {
            stream = stream.filter(e -> e.getStatus() != EquipmentStatus.INACTIVE);
        }

        List<Equipment> filteredList = stream.collect(Collectors.toList());

        java.util.Map<String, java.util.function.Function<Equipment, Comparable<?>>> extractors =
                new java.util.HashMap<>();

        extractors.put("id", Equipment::getId);
        extractors.put("equipmentName", Equipment::getEquipmentName);
        extractors.put("equipmentCode", Equipment::getEquipmentCode);

        extractors.put("status", e -> e.getStatus() != null ? e.getStatus().name() : "");

        // SỬA:
        // Không còn sort theo roomNumber trực tiếp.
        // Nếu vẫn sortBy roomNumber thì lấy room đầu tiên trong roomEquipments.
        extractors.put("roomNumber", e -> {
            if (e.getRoomEquipments() == null || e.getRoomEquipments().isEmpty()) {
                return "";
            }

            Room room = e.getRoomEquipments().get(0).getRoom();
            return room != null && room.getRoomNumber() != null ? room.getRoomNumber() : "";
        });

        pageableUtils.sortList(filteredList, sortBy, direction, extractors);

        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        return pageableUtils.paginate(filteredList, pageable)
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

        // SỬA:
        // Chỉ tạo thiết bị vào danh sách Equipment.
        // Không gán phòng trong create nữa.
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

        // SỬA:
        // Chỉ update thông tin thiết bị.
        // Không update room ở đây nữa.
        equipmentMapper.updateEquipmentFromDto(dto, equipment);

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        return equipmentMapper.toResponse(updatedEquipment);
    }

    @Override
    public void deleteEquipment(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(id, locale);

        equipment.setStatus(EquipmentStatus.INACTIVE);
        equipmentRepository.save(equipment);
    }

    @Override
    public EquipmentResponse findById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(id, locale);

        return equipmentMapper.toResponse(equipment);
    }

    // THÊM MỚI:
    // API cho màn hình Assign Equipment To Room.
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

        // Nếu phòng đã có thiết bị này rồi thì update quantity.
        // Nếu chưa có thì tạo mới.
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

    // THÊM MỚI:
    // Gỡ thiết bị khỏi phòng.
    @Override
    public void removeFromRoom(Long equipmentId, Long roomId) {
        Locale locale = LocaleContextHolder.getLocale();

        findActiveEquipment(equipmentId, locale);

        RoomEquipment roomEquipment = roomEquipmentRepository
                .findByRoomIdAndEquipmentId(roomId, equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment is not assigned to this room"
                ));

        roomEquipmentRepository.delete(roomEquipment);
    }

    // THÊM MỚI:
    // Lấy danh sách thiết bị trong 1 phòng.
    @Override
    @Transactional(readOnly = true)
    public List<RoomEquipmentResponse> getEquipmentsByRoom(Long roomId) {
        return roomEquipmentRepository.findByRoomId(roomId)
                .stream()
                .map(equipmentMapper::toRoomEquipmentResponse)
                .collect(Collectors.toList());
    }

    // THÊM MỚI:
    // Upload ảnh local cho thiết bị.
    @Override
    public EquipmentImageResponse uploadImage(Long equipmentId, MultipartFile image, Boolean isPrimary) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(equipmentId, locale);

        if (image == null || image.isEmpty()) {
            throw new ConflictException("Image file is required");
        }

        try {
            // Ảnh sẽ được lưu tại thư mục:
            // uploads/equipments/
            Path uploadPath = Paths.get("uploads/equipments")
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(uploadPath);

            String originalName = image.getOriginalFilename() == null
                    ? "equipment-image"
                    : image.getOriginalFilename();

            originalName = StringUtils.cleanPath(originalName);

            String fileName = UUID.randomUUID() + "_" + originalName;

            Path targetPath = uploadPath.resolve(fileName).normalize();

            Files.copy(
                    image.getInputStream(),
                    targetPath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            EquipmentImage equipmentImage = EquipmentImage.builder()
                    .equipment(equipment)
                    .imageUrl("/uploads/equipments/" + fileName)
                    .isPrimary(Boolean.TRUE.equals(isPrimary))
                    .build();

            EquipmentImage savedImage = equipmentImageRepository.save(equipmentImage);

            return equipmentMapper.toImageResponse(savedImage);

        } catch (IOException ex) {
            throw new ConflictException("Could not save equipment image");
        }
    }

    // THÊM MỚI:
    // Dùng chung cho các hàm cần kiểm tra Equipment ACTIVE.
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
}