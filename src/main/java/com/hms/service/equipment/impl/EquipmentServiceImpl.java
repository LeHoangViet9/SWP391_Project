package com.hms.service.equipment.impl;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.BadRequestException;
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
                .map(equipmentMapper::toResponse)
                .map(this::enrichResponseWithStock);
    }

    @Override
    public EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO) {
        Locale locale = LocaleContextHolder.getLocale();

        if (equipmentRepository.existsByEquipmentCodeIgnoreCase(equipmentDTO.getEquipmentCode())) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.equipment.code.existed",
                            new Object[]{equipmentDTO.getEquipmentCode()},
                            locale
                    )
            );
        }

        Equipment equipment = equipmentMapper.toEntity(equipmentDTO);
        if (equipment.getTotalQuantity() == null) {
            equipment.setTotalQuantity(0);
        }
        equipment.setStatus(EquipmentStatus.ACTIVE);

        Equipment savedEquipment = equipmentRepository.save(equipment);

        return enrichResponseWithStock(equipmentMapper.toResponse(savedEquipment));
    }

    @Override
    public EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Equipment equipment = findActiveEquipment(id, locale);

        if (!equipment.getEquipmentCode().equalsIgnoreCase(dto.getEquipmentCode())
                && equipmentRepository.existsByEquipmentCodeIgnoreCaseAndIdNot(dto.getEquipmentCode(), id)) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.equipment.code.existed",
                            new Object[]{dto.getEquipmentCode()},
                            locale
                    )
            );
        }

        equipmentMapper.updateEquipmentFromDto(dto, equipment);
        if (dto.getTotalQuantity() != null) {
            equipment.setTotalQuantity(dto.getTotalQuantity());
        }

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        return enrichResponseWithStock(equipmentMapper.toResponse(updatedEquipment));
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

        return enrichResponseWithStock(equipmentMapper.toResponse(equipment));
    }

    private EquipmentResponse enrichResponseWithStock(EquipmentResponse res) {
        if (res == null || res.getId() == null) return res;
        int total = res.getTotalQuantity() != null ? res.getTotalQuantity() : 0;
        int assigned = roomEquipmentRepository.sumQuantityByEquipmentId(res.getId());
        res.setAssignedQuantity(assigned);
        res.setAvailableQuantity(Math.max(0, total - assigned));
        return res;
    }

    // BỔ SUNG: Danh sách trắng MIME Type cho phép upload ảnh để chống giả mạo đuôi file (File Upload Security)
    private static final java.util.Set<String> ALLOWED_MIME_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

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

        // THAY ĐỔI / SỬA LỖI LOGIC: Nếu số lượng truyền vào <= 0 thì thực hiện xóa liên kết khỏi phòng
        // Thay vì trước đây vẫn lưu bản ghi RoomEquipment với quantity = 0 vào Database.
        if (dto.getQuantity() == null || dto.getQuantity() <= 0) {
            roomEquipmentRepository.findByRoomIdAndEquipmentId(dto.getRoomId(), equipmentId)
                    .ifPresent(roomEquipmentRepository::delete);
            return null;
        }

        // THAY ĐỔI / RÀNG BUỘC TỒN KHO: Kiểm tra số lượng tồn kho khả dụng trước khi gán
        int totalQty = equipment.getTotalQuantity() != null ? equipment.getTotalQuantity() : 0;
        int assignedOtherRooms = roomEquipmentRepository.sumQuantityByEquipmentIdAndRoomIdNot(equipmentId, dto.getRoomId());
        if (assignedOtherRooms + dto.getQuantity() > totalQty) {
            int maxCanAssign = Math.max(0, totalQty - assignedOtherRooms);
            throw new BadRequestException("Không đủ thiết bị trong kho! Số lượng khả dụng tối đa: " + maxCanAssign);
        }

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

        // THAY ĐỔI / BỔ SUNG EDGE CASE: Chặn không cho gỡ thiết bị khỏi phòng nếu thiết bị trong phòng đó
        // đang thuộc một phiếu bảo trì dở dang (PENDING, ASSIGNED, IN_PROGRESS).
        List<MaintenanceStatus> activeStatuses = List.of(
                MaintenanceStatus.PENDING, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS
        );
        if (maintenanceRepository.existsByEquipmentIdAndRoomIdAndStatusIn(equipmentId, roomId, activeStatuses)) {
            throw new ConflictException("Cannot remove equipment from room while active maintenance exists");
        }

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
            throw new BadRequestException(
                    messageSource.getMessage("error.equipment.image.required", null, locale)
            );
        }

        // Tắt cờ isPrimary (ảnh chính) ở các ảnh cũ để ảnh mới được gán làm ảnh chính duy nhất
        if (equipment.getImages() != null) {
            for (EquipmentImage img : equipment.getImages()) {
                if (Boolean.TRUE.equals(img.getIsPrimary())) {
                    img.setIsPrimary(false);
                    equipmentImageRepository.save(img);
                }
            }
        }

        List<EquipmentImage> imagesToSave = new java.util.ArrayList<>();

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

                // THAY ĐỔI / BẢO MẬT: Validate Content-Type (MIME) thực tế của file đính kèm
                // nhằm ngăn chặn hành vi đổi tên đuôi file mã độc (.php -> .png) để bypass hệ thống.
                String contentType = image.getContentType();
                if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
                    throw new BadRequestException(
                            messageSource.getMessage("error.equipment.image.invalid_extension", new Object[]{ALLOWED_MIME_TYPES}, locale)
                    );
                }

                // BỔ SUNG / BẢO MẬT: Kiểm tra magic bytes (byte đầu tiên của file)
                // getContentType() chỉ dựa vào header HTTP do browser khai — không đáng tin.
                // Magic bytes mới là thứ xác định loại file THẬT SỰ bên trong.
                // Ví dụ: đổi tên file.txt → file.png, browser vẫn khai image/png nhưng magic bytes sẽ lộ.
                if (!isValidImageMagicBytes(image)) {
                    throw new BadRequestException(
                            messageSource.getMessage("error.equipment.image.invalid_extension", new Object[]{ALLOWED_MIME_TYPES}, locale)
                    );
                }

                String originalName = image.getOriginalFilename() == null
                        ? "image.jpg"
                        : image.getOriginalFilename();

                originalName = StringUtils.cleanPath(originalName);

                String extension = ".jpg";
                int dotIndex = originalName.lastIndexOf('.');
                if (dotIndex >= 0) {
                    extension = originalName.substring(dotIndex);
                }

                List<String> allowedExtensions = List.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
                if (!allowedExtensions.contains(extension.toLowerCase())) {
                    throw new BadRequestException(
                            messageSource.getMessage("error.equipment.image.invalid_extension", new Object[]{allowedExtensions}, locale)
                    );
                }

                String fileName = equipment.getEquipmentCode().toLowerCase() + "_"
                        + UUID.randomUUID().toString().substring(0, 8) + extension;

                Path targetPath = uploadPath.resolve(fileName).normalize();

                // THAY ĐỔI / BẢO MẬT: Kiểm tra an toàn đường dẫn lưu file chống tấn công Path Traversal (vd: ../../etc/passwd)
                if (!targetPath.startsWith(uploadPath)) {
                    throw new SecurityException("Path traversal attempt detected");
                }

                Files.copy(
                        image.getInputStream(),
                        targetPath,
                        StandardCopyOption.REPLACE_EXISTING
                );

                imagesToSave.add(EquipmentImage.builder()
                        .equipment(equipment)
                        .imageUrl("/uploads/equipments/" + fileName)
                        .isPrimary(firstImage)
                        .build());

                firstImage = false;
            }

            if (imagesToSave.isEmpty()) {
                throw new BadRequestException(
                        messageSource.getMessage("error.equipment.image.required", null, locale)
                );
            }

            // THAY ĐỔI / TỐI ƯU HIỆU NĂNG: Lưu toàn bộ ảnh mới bằng saveAll() trong 1 lượt thay vì save từng ảnh lẻ
            List<EquipmentImage> savedImages = equipmentImageRepository.saveAll(imagesToSave);
            return savedImages.stream().map(equipmentMapper::toImageResponse).collect(Collectors.toList());

        } catch (IOException ex) {
            throw new ConflictException(
                    messageSource.getMessage("error.equipment.image.save_failed", null, locale)
            );
        }
    }

    /**
     * BỔ SUNG / BẢO MẬT: Đọc magic bytes (byte đầu tiên) của file để xác định loại thật.
     * Lý do: getContentType() chỉ đọc header HTTP do browser tự khai dựa trên đuôi file,
     * không đáng tin. Đổi tên file.exe → file.png vẫn bypass được MIME check.
     * Magic bytes là dữ liệu nhị phân cứng trong file, không thể giả mạo dễ dàng.
     *
     * Các magic bytes được hỗ trợ:
     *   JPEG : FF D8 FF
     *   PNG  : 89 50 4E 47
     *   GIF  : 47 49 46 38
     *   WEBP : 52 49 46 46 (RIFF header)
     */
    private boolean isValidImageMagicBytes(MultipartFile file) throws IOException {
        byte[] header = new byte[8];
        int bytesRead = file.getInputStream().read(header);
        if (bytesRead < 3) return false; // file quá nhỏ, không hợp lệ

        // JPEG: FF D8 FF
        if ((header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF) return true;

        // PNG: 89 50 4E 47
        if ((header[0] & 0xFF) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4E
                && header[3] == 0x47) return true;

        // GIF: 47 49 46 38 ("GIF8")
        if (header[0] == 0x47
                && header[1] == 0x49
                && header[2] == 0x46
                && header[3] == 0x38) return true;

        // WEBP: 52 49 46 46 ... 57 45 42 50 ("RIFF....WEBP")
        if (bytesRead >= 8
                && header[0] == 0x52 && header[1] == 0x49
                && header[2] == 0x46 && header[3] == 0x46
                && header[4] != 0) {
            // bytes 4-7 là file size (variable), bỏ qua
            // cần đọc thêm 4 bytes để check "WEBP" marker
            byte[] webpMarker = new byte[4];
            file.getInputStream().skip(4);
            int read = file.getInputStream().read(webpMarker);
            if (read == 4
                    && webpMarker[0] == 0x57 && webpMarker[1] == 0x45
                    && webpMarker[2] == 0x42 && webpMarker[3] == 0x50) return true;
        }

        return false; // không khớp magic bytes nào → không phải ảnh thật
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

    // THAY ĐỔI / TỐI ƯU HIỆU NĂNG VÀ N+1 QUERY:
    // Triển khai gán thiết bị theo lô (Bulk Assign) không bị N+1 Query.
    // Lấy toàn bộ danh sách Equipment và RoomEquipment trong 1-2 SQL queries,
    // sau đó phân loại toSave / toDelete và gọi saveAll() & deleteAll().
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

        if (dtos == null || dtos.isEmpty()) {
            throw new BadRequestException("At least one equipment assignment is required");
        }

        // Kiểm tra dữ liệu trùng lặp trong DTO truyền vào
        java.util.Set<Long> equipmentIds = dtos.stream()
                .map(BulkAssignEquipmentDTO::getEquipmentId)
                .collect(Collectors.toSet());
        if (equipmentIds.size() != dtos.size()) {
            throw new BadRequestException("Each equipment can appear only once in a bulk assignment");
        }

        // BƯỚC 1 (TỐI ƯU N+1): Fetch toàn bộ danh sách Equipments ACTIVE trong 1 câu SQL single query
        java.util.Map<Long, Equipment> equipmentMap = equipmentRepository.findAllById(equipmentIds).stream()
                .filter(e -> e.getStatus() == EquipmentStatus.ACTIVE)
                .collect(Collectors.toMap(Equipment::getId, java.util.function.Function.identity()));

        if (equipmentMap.size() != equipmentIds.size()) {
            throw new ResourceNotFoundException("Some specified equipments were not found or are inactive");
        }

        // BƯỚC 2 (TỐI ƯU N+1): Fetch toàn bộ RoomEquipment hiện tại của phòng trong 1 câu SQL single query
        java.util.Map<Long, RoomEquipment> existingAssignments = roomEquipmentRepository.findByRoomId(roomId).stream()
                .collect(Collectors.toMap(re -> re.getEquipment().getId(), java.util.function.Function.identity()));

        List<RoomEquipment> toSave = new java.util.ArrayList<>();
        List<RoomEquipment> toDelete = new java.util.ArrayList<>();

        // BƯỚC 3: Xử lý dữ liệu trong bộ nhớ (In-Memory processing)
        for (BulkAssignEquipmentDTO dto : dtos) {
            Long eqId = dto.getEquipmentId();
            Integer quantity = dto.getQuantity();
            RoomEquipment existing = existingAssignments.get(eqId);

            if (quantity == null || quantity <= 0) {
                // Nếu số lượng <= 0: Thêm vào danh sách xóa khỏi phòng
                if (existing != null) {
                    toDelete.add(existing);
                }
            } else {
                // THAY ĐỔI / RÀNG BUỘC TỒN KHO: Kiểm tra số lượng tồn kho khả dụng trước khi gán
                Equipment eqObj = equipmentMap.get(eqId);
                int totalQty = eqObj.getTotalQuantity() != null ? eqObj.getTotalQuantity() : 0;
                int assignedOtherRooms = roomEquipmentRepository.sumQuantityByEquipmentIdAndRoomIdNot(eqId, roomId);
                if (assignedOtherRooms + quantity > totalQty) {
                    int maxCanAssign = Math.max(0, totalQty - assignedOtherRooms);
                    throw new BadRequestException("Thiết bị '" + eqObj.getEquipmentName() + "' không đủ trong kho! Số lượng khả dụng tối đa: " + maxCanAssign);
                }

                // Nếu số lượng > 0 và hợp lệ: Cập nhật bản ghi hiện tại hoặc tạo bản ghi mới
                if (existing == null) {
                    existing = RoomEquipment.builder()
                            .room(room)
                            .equipment(eqObj)
                            .quantity(quantity)
                            .build();
                } else {
                    existing.setQuantity(quantity);
                }
                toSave.add(existing);
            }
        }

        // BƯỚC 4 (TỐI ƯU N+1): Thực thi Batch Delete và Batch Save để tối ưu câu lệnh DB
        if (!toDelete.isEmpty()) {
            roomEquipmentRepository.deleteAll(toDelete);
        }
        List<RoomEquipment> savedList = roomEquipmentRepository.saveAll(toSave);

        return savedList.stream()
                .map(equipmentMapper::toRoomEquipmentResponse)
                .collect(Collectors.toList());
    }
}
