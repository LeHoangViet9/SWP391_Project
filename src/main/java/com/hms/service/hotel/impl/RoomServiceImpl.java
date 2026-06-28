package com.hms.service.hotel.impl;

import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.CloudinaryUtils;
import com.hms.common.utils.LocalFileUtils;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomImage;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.hotel.IRoomService;
import com.hms.service.audit.AuditLogService;
import java.util.Map;
import java.util.LinkedHashMap;
import com.hms.service.hotel.mapper.RoomMapper;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.hms.common.audit.Auditable;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements IRoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomMapper roomMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;
    private final LocalFileUtils localFileUtils;
    private final AuditLogService auditLogService;

    @Override
    public Page<RoomResponse> getAllRooms(
            String keyword,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        Pageable pageable = pageableUtils.createPageable(
                page,
                size,
                sortBy.getField(),
                direction
        );

        return roomRepository
                .searchRooms(keyword, pageable)
                .map(roomMapper::toResponse);
    }



    @Override
    public RoomResponse getRoomById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        // Lấy phòng theo id nhưng lọc các phòng đã bị xóa (INACTIVE)
        Room room = roomRepository.findById(id)
                .filter(r -> r.getRoomStatus() != RoomStatus.INACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));
        return roomMapper.toResponse(room);
    }

    @Override
    @Transactional
    @Auditable(action = "CREATE_ROOM", module = "ROOM", logSuccess = false)
    public RoomResponse createRoom(RoomRequest request, List<MultipartFile> file) {
        Locale locale = LocaleContextHolder.getLocale();

        // Kiểm tra loại phòng
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));

        Room room = new Room();
        populateRoomData(room, request, roomType);

        // Sinh số phòng tự động theo thứ tự tăng dần dựa trên floorNumber
        String generatedRoomNumber = generateRoomNumber(request.getFloorNumber());
        room.setRoomNumber(generatedRoomNumber);

        // Khởi tạo list ảnh trống cho đối tượng Room mới tạo
        room.setRoomImages(new ArrayList<>());

        // XỬ LÝ ẢNH MỚI: Upload lên Local Storage và lưu vào bảng room_img thay vì lưu cột cũ
        if (file != null && !file.isEmpty()) {

            for (MultipartFile f : file) {

                String imageUrl = localFileUtils.uploadFile(f);

                RoomImage roomImage = RoomImage.builder()
                        .room(room)
                        .imageUrl(imageUrl)
                        .description("Ảnh khi tạo phòng")
                        .build();

                room.getRoomImages().add(roomImage);
            }
        }

        // Set mặc định trạng thái phòng sẵn sàng hoạt động
        room.setRoomStatus(RoomStatus.AVAILABLE);

        Room saved = roomRepository.save(room);
        auditLogService.logSuccess(
                "CREATE_ROOM",
                "ROOM",
                "ROOM",
                saved.getId(),
                saved.getRoomNumber(),
                auditLogService.changes(null, roomAuditSnapshot(saved))
        );
        return roomMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_ROOM", module = "ROOM", logSuccess = false)
    public RoomResponse updateRoom(Long id, RoomRequest request, List<MultipartFile> file) {
        Locale locale = LocaleContextHolder.getLocale();

        Room room = roomRepository.findById(id)
                .filter(r -> r.getRoomStatus() != RoomStatus.INACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));
        Map<String, Object> before = roomAuditSnapshot(room);

        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));

        // Nếu thay đổi tầng, tự động cập nhật số phòng theo tầng mới
        if (!room.getFloorNumber().equals(request.getFloorNumber())) {
            String generatedRoomNumber = generateRoomNumber(request.getFloorNumber());
            room.setRoomNumber(generatedRoomNumber);
        }

        populateRoomData(room, request, roomType);

        // XỬ LÝ ẢNH CẬP NHẬT: Thêm một ảnh mới vào Album ảnh hiện tại của phòng
        if (file != null && !file.isEmpty()) {

            for (MultipartFile f : file) {

                String imageUrl = localFileUtils.uploadFile(f);

                RoomImage roomImage = RoomImage.builder()
                        .room(room)
                        .imageUrl(imageUrl)
                        .description("Ảnh khi tạo phòng")
                        .build();

                room.getRoomImages().add(roomImage);
            }
        }

        Room updated = roomRepository.save(room);
        auditLogService.logSuccess(
                "UPDATE_ROOM",
                "ROOM",
                "ROOM",
                updated.getId(),
                updated.getRoomNumber(),
                auditLogService.changes(before, roomAuditSnapshot(updated))
        );
        return roomMapper.toResponse(updated);
    }

    @Override
    @Transactional
    @Auditable(action = "DELETE_ROOM", module = "ROOM", logSuccess = false)
    public void deleteRoomByID(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        // Lấy phòng và đảm bảo phòng chưa bị soft-delete
        Room room = roomRepository.findById(id)
                .filter(r -> r.getRoomStatus() != RoomStatus.INACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));

        // Soft delete: Set status = INACTIVE thay vì xóa thực sự
        Map<String, Object> before = roomAuditSnapshot(room);
        room.setRoomStatus(RoomStatus.INACTIVE);
        Room deleted = roomRepository.save(room);
        auditLogService.logSuccess(
                "DELETE_ROOM",
                "ROOM",
                "ROOM",
                deleted.getId(),
                deleted.getRoomNumber(),
                auditLogService.changes(before, roomAuditSnapshot(deleted))
        );
    }

    @Override
    public Page<RoomResponse> getRoomsByStatus(RoomStatus roomStatus, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", SortDirection.ASC);
        return roomRepository.findByRoomStatus(roomStatus, pageable).map(roomMapper::toResponse);
    }

    @Override
    public Page<RoomResponse> getRoomsByFloor(Integer floorNumber, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "roomNumber", SortDirection.ASC);
        // Lấy phòng theo tầng, loại trừ các phòng INACTIVE
        return roomRepository.findByFloorNumberAndRoomStatusNot(floorNumber, RoomStatus.INACTIVE, pageable)
                .map(roomMapper::toResponse);
    }

    @Override
    public Page<RoomResponse> getRoomsByRoomType(Long roomTypeId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "roomNumber", SortDirection.ASC);
        // Lấy phòng theo loại, loại trừ các phòng INACTIVE
        return roomRepository.findByRoomTypeIdAndRoomStatusNot(roomTypeId, RoomStatus.INACTIVE, pageable)
                .map(roomMapper::toResponse);
    }

    @Override
    @Transactional
    @Auditable(action = "UPDATE_ROOM_STATUS", module = "ROOM", logSuccess = false)
    public void updateRoomStatus(Long roomId, RoomStatus status) {
        Locale locale = LocaleContextHolder.getLocale();
        // Chặn việc đặt INACTIVE qua API status — INACTIVE chỉ dành cho soft delete (deleteRoomByID)
        if (status == RoomStatus.INACTIVE) {
            throw new BadRequestException(
                    messageSource.getMessage("error.room.status.inactive.forbidden", null,
                            "Không thể đặt trạng thái INACTIVE trực tiếp. Hãy dùng chức năng xóa phòng.", locale));
        }
        Room room = roomRepository.findById(roomId)
                .filter(r -> r.getRoomStatus() != RoomStatus.INACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.room.notfound", null, locale)));
        Map<String, Object> before = roomAuditSnapshot(room);
        room.setRoomStatus(status);
        Room updated = roomRepository.save(room);
        auditLogService.logSuccess(
                "UPDATE_ROOM_STATUS",
                "ROOM",
                "ROOM",
                updated.getId(),
                updated.getRoomNumber(),
                auditLogService.changes(before, roomAuditSnapshot(updated))
        );
    }

    @Override
    public void deleteRoomImage(Long roomId, String imageUrl) {

    }

    /**
     * Method private để sinh số phòng tự động dựa trên floorNumber
     */
    private String generateRoomNumber(Integer floorNumber) {
        List<Room> roomsOnFloor = roomRepository.findByFloorNumber(floorNumber);
        int maxNumber = floorNumber * 100 - 1;
        for (Room r : roomsOnFloor) {
            try {
                int num = Integer.parseInt(r.getRoomNumber());
                if (num > maxNumber) {
                    maxNumber = num;
                }
            } catch (NumberFormatException e) {
                // Bỏ qua nếu số phòng không phải định dạng số
            }
        }
        return String.valueOf(maxNumber + 1);
    }

    /**
     * Method private để fill data từ request vào entity
     * Tái sử dụng trong cả create và update
     */
    private void populateRoomData(Room room, RoomRequest request, RoomType roomType) {
        room.setRoomType(roomType);
        room.setFloorNumber(request.getFloorNumber());
        room.setDescription(request.getDescription());
    }

    /**
     * Lấy tất cả phòng đang trống (status = AVAILABLE)
     */
    @Override
    public Page<RoomResponse> getAvailableRooms(Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "roomNumber", SortDirection.ASC);
        return roomRepository.findByRoomStatus(RoomStatus.AVAILABLE, pageable).map(roomMapper::toResponse);
    }

    private Map<String, Object> roomAuditSnapshot(Room room) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", room.getId());
        snapshot.put("roomNumber", room.getRoomNumber());
        snapshot.put("roomTypeId", room.getRoomType() == null ? null : room.getRoomType().getId());
        snapshot.put("roomTypeName", room.getRoomType() == null ? null : room.getRoomType().getTypeName());
        snapshot.put("roomStatus", room.getRoomStatus() == null ? null : room.getRoomStatus().name());
        snapshot.put("floorNumber", room.getFloorNumber());
        snapshot.put("description", room.getDescription());
        return snapshot;
    }
}