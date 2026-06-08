package com.hms.service.equipment.impl;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.CloudinaryUtils;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.equipment.EquipmentImage;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
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
    private final CloudinaryUtils cloudinaryUtils;

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
    @Transactional
    public EquipmentResponse createEquipment(EquipmentCreateDTO request, MultipartFile file) {
        Locale locale = LocaleContextHolder.getLocale();

        // Kiểm tra xem số/mã thiết bị đã tồn tại chưa
        if (equipmentRepository.existsByEquipmentCodeAndStatus(request.getEquipmentCode(), EquipmentStatus.ACTIVE)) {
            throw new ConflictException(messageSource.getMessage("error.equipment.code.existed", new Object[]{request.getEquipmentCode()}, locale));
        }

        Equipment equipment = equipmentMapper.toEntity(request);

        // Kiểm tra phòng (Room) nếu request có truyền roomId lên
        if (request.getRoomId() != null) {
            Room room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage(ERROR_ROOM_NOTFOUND, new Object[]{request.getRoomId()}, locale)));
            equipment.setRoom(room);
        }

        // Khởi tạo list ảnh trống cho đối tượng Equipment mới tạo
        equipment.setImages(new ArrayList<>());

        // XỬ LÝ ẢNH MỚI: Upload lên Cloudinary và lưu vào bảng equipment_images
        if (file != null && !file.isEmpty()) {
            // Đồng bộ hàm gọi từ CloudinaryUtils giống hàm createRoom của bạn
            String imageUrl = cloudinaryUtils.uploadFile(file);

            EquipmentImage equipmentImage = EquipmentImage.builder()
                    .equipment(equipment)
                    .imageUrl(imageUrl)
                    .isPrimary(true) // Ảnh đầu tiên tạo mặc định là ảnh chính
                    .build();

            // Thêm ảnh vào bộ sưu tập của thiết bị. Nhờ CascadeType.ALL, Hibernate sẽ tự động lưu xuống DB
            equipment.getImages().add(equipmentImage);
        }

        // Set mặc định trạng thái thiết bị hoạt động bình thường
        equipment.setStatus(EquipmentStatus.ACTIVE);

        Equipment saved = equipmentRepository.save(equipment);
        return equipmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO request, MultipartFile file) {
        Locale locale = LocaleContextHolder.getLocale();

        // 1. Tìm thiết bị theo ID (Bỏ filter ACTIVE để cho phép cập nhật thiết bị đang bảo trì/hỏng)
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_EQUIPMENT_NOTFOUND, new Object[]{id}, locale)));

        // 2. Kiểm tra trùng mã thiết bị với các thiết bị khác đang hoạt động
        if (!equipment.getEquipmentCode().equals(request.getEquipmentCode())
                && equipmentRepository.existsByEquipmentCodeAndIdNotAndStatus(
                request.getEquipmentCode(), id, EquipmentStatus.ACTIVE)) {
            throw new ConflictException(
                    messageSource.getMessage("error.equipment.code.existed", new Object[]{request.getEquipmentCode()}, locale));
        }

        // 3. Cập nhật các trường thông tin cơ bản từ DTO vào Entity
        equipmentMapper.updateEquipmentFromDto(request, equipment);

        // 4. Xử lý gán phòng (Room) cho thiết bị
        if (request.getRoomId() != null) {
            Room room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage(ERROR_ROOM_NOTFOUND, new Object[]{request.getRoomId()}, locale)));
            equipment.setRoom(room);
        } else {
            equipment.setRoom(null);
        }

        // 5. XỬ LÝ ẢNH MỚI: Nếu client gửi file ảnh mới lên, upload lên Cloudinary và cập nhật
        if (file != null && !file.isEmpty()) {
            String imageUrl = cloudinaryUtils.uploadFile(file);

            // Hủy kích hoạt trạng thái "isPrimary" của tất cả ảnh cũ trong list (nếu có)
            if (equipment.getImages() != null) {
                equipment.getImages().forEach(img -> img.setIsPrimary(false));
            } else {
                equipment.setImages(new ArrayList<>());
            }

            // Tạo bản ghi ảnh mới và đánh dấu làm ảnh chính (isPrimary = true)
            EquipmentImage newEquipmentImage = EquipmentImage.builder()
                    .equipment(equipment)
                    .imageUrl(imageUrl)
                    .isPrimary(true)
                    .build();

            // Thêm vào danh sách để Hibernate tự động cascade lưu xuống DB
            equipment.getImages().add(newEquipmentImage);
        }

        // 6. Lưu thực thể đã cập nhật và trả về kết quả
        Equipment updated = equipmentRepository.save(equipment);
        return equipmentMapper.toResponse(updated);
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