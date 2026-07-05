package com.hms.service.maintenance.impl;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import com.hms.repository.equipment.EquipmentRepository;
import com.hms.repository.equipment.RoomEquipmentRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.maintenance.MaintenanceRepository;
import com.hms.service.maintenance.MaintenanceService;
import com.hms.service.maintenance.mapper.MaintenanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.hms.common.exception.ConflictException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceMapper maintenanceMapper;
    private final PageableUtils pageableUtils;
    private final MessageSource messageSource;

    private static final String ERROR_MAINTENANCE_NOTFOUND = "error.maintenance.notfound";
    private static final String ERROR_ROOM_NOTFOUND = "error.room.notfound";
    private static final String ERROR_EQUIPMENT_NOTFOUND = "error.equipment.notfound";
    private static final String ERROR_EQUIPMENT_NOT_ASSIGNED = "error.equipment.not.assigned.room";
    private static final String ERROR_MAINTENANCE_ROOM_OR_EQUIPMENT_REQUIRED =
            "error.maintenance.room.or.equipment.required";

    // SỬA MỚI:
    // Dùng để kiểm tra roomId có tồn tại không khi tạo maintenance request.
    private final RoomRepository roomRepository;

    // SỬA MỚI:
    // Dùng để kiểm tra equipmentId có tồn tại không khi tạo maintenance request.
    private final EquipmentRepository equipmentRepository;

    // SỬA MỚI:
    // Dùng để kiểm tra thiết bị có đang được gán vào phòng đó không.
    // Phục vụ đúng ý thầy: request phải rõ gắn với phòng hay thiết bị.
    private final RoomEquipmentRepository roomEquipmentRepository;

    /*
     * Chức năng:
     * Tạo yêu cầu bảo trì mới.
     * "Kiểm tra lại request gắn với phòng hay thiết bị"
     *
     * Nghĩa là:
     * - Request sửa phòng thì phải có roomId.
     * - Request sửa thiết bị thì phải có equipmentId.
     * - Nếu có cả roomId và equipmentId thì thiết bị đó phải đang được gán vào phòng đó.
     * - Không cho tạo request mơ hồ khi cả roomId và equipmentId đều null.
     */
    @Override
    public MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        // SỬA MỚI:
        // Không cho tạo maintenance request nếu không gắn với phòng hoặc thiết bị.
        if (dto.getRoomId() == null && dto.getEquipmentId() == null) {
            throw new ConflictException(
                    messageSource.getMessage(
                            ERROR_MAINTENANCE_ROOM_OR_EQUIPMENT_REQUIRED,
                            null,
                            locale
                    )
            );
        }

        // SỬA MỚI:
        // Nếu có roomId thì kiểm tra phòng đó có tồn tại trong DB không.
        if (dto.getRoomId() != null && !roomRepository.existsById(dto.getRoomId())) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage(
                            ERROR_ROOM_NOTFOUND,
                            new Object[]{dto.getRoomId()},
                            locale
                    )
            );
        }

        // SỬA MỚI:
        // Nếu có equipmentId thì kiểm tra thiết bị đó có tồn tại trong DB không.
        if (dto.getEquipmentId() != null && !equipmentRepository.existsById(dto.getEquipmentId())) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage(
                            ERROR_EQUIPMENT_NOTFOUND,
                            new Object[]{dto.getEquipmentId()},
                            locale
                    )
            );
        }

        // SỬA MỚI:
        // Nếu request vừa có roomId vừa có equipmentId,
        // thì phải kiểm tra thiết bị đó đã được gán vào đúng phòng đó chưa.
        //
        // Ví dụ hợp lệ:
        // roomId = 101, equipmentId = TV
        // và trong bảng room_equipments có TV thuộc phòng 101.
        //
        // Nếu không có trong room_equipments thì không hợp lệ,
        // vì không thể báo TV phòng 101 hỏng trong khi TV đó không thuộc phòng 101.
        if (dto.getRoomId() != null && dto.getEquipmentId() != null) {
            boolean assigned = roomEquipmentRepository.existsByRoomIdAndEquipmentId(
                    dto.getRoomId(),
                    dto.getEquipmentId()
            );

            if (!assigned) {
                throw new ConflictException(
                        messageSource.getMessage(
                                ERROR_EQUIPMENT_NOT_ASSIGNED,
                                null,
                                locale
                        )
                );
            }
        }

        RepairRequest repairRequest = maintenanceMapper.toEntity(dto);

        // Khi tạo mới, trạng thái mặc định luôn là PENDING.
        repairRequest.setStatus(MaintenanceStatus.PENDING);

        RepairRequest saved = maintenanceRepository.save(repairRequest);

        // THAY ĐỔI: Tự động chuyển trạng thái phòng sang MAINTENANCE khi bắt đầu bảo trì
        if (saved.getRoomId() != null) {
            roomRepository.findById(saved.getRoomId()).ifPresent(room -> {
                room.setRoomStatus(com.hms.common.enums.RoomStatus.MAINTENANCE);
                roomRepository.save(room);
            });
        }

        return maintenanceMapper.toResponse(saved);
    }

    /*
     * Chức năng:
     * Cập nhật yêu cầu bảo trì.
     *
     * Dùng cho:
     * - Phân công nhân viên sửa chữa.
     * - Đổi mức độ nghiêm trọng.
     * - Đổi trạng thái: ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED.
     * - Ghi diagnosis và repairResult.
     */
    @Override
    @org.springframework.transaction.annotation.Transactional
    public MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        messageSource.getMessage(
                                                ERROR_MAINTENANCE_NOTFOUND,
                                                new Object[]{id},
                                                locale
                                        )
                                ));

        maintenanceMapper.updateFromDto(dto, repairRequest);

        // THAY ĐỔI: Khi trạng thái chuyển sang COMPLETED (Hoàn thành) hoặc CANCELLED (Hủy), 
        // tự động cập nhật lại trạng thái phòng về AVAILABLE để khách hàng có thể đặt phòng được ngay
        if (dto.getStatus() == MaintenanceStatus.COMPLETED || dto.getStatus() == MaintenanceStatus.CANCELLED) {
            if (dto.getStatus() == MaintenanceStatus.COMPLETED) {
                repairRequest.setCompletedAt(LocalDateTime.now());
            }
            if (repairRequest.getRoomId() != null) {
                roomRepository.findById(repairRequest.getRoomId()).ifPresent(room -> {
                    room.setRoomStatus(com.hms.common.enums.RoomStatus.AVAILABLE);
                    roomRepository.save(room);
                });
            }
        }

        RepairRequest updated = maintenanceRepository.save(repairRequest);

        return maintenanceMapper.toResponse(updated);
    }

    /*
     * Chức năng:
     * Lấy chi tiết một yêu cầu bảo trì theo id.
     */
    @Override
    public MaintenanceResponse getRequestById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        messageSource.getMessage(
                                                ERROR_MAINTENANCE_NOTFOUND,
                                                new Object[]{id},
                                                locale
                                        )
                                ));

        return maintenanceMapper.toResponse(repairRequest);
    }

    /*
     * Chức năng:
     * Lấy danh sách yêu cầu bảo trì có phân trang, lọc và sắp xếp.
     *
     * Có thể lọc theo:
     * - id
     * - issueTitle
     * - roomId
     * - equipmentId
     * - reportedBy
     * - assignedTo
     * - severity
     * - status
     */
    @Override
    public Page<MaintenanceResponse> getAllRequests(
            String keyword, // Dùng duy nhất keyword thay cho id, issueTitle, roomId,...
            MaintenanceSeverity severity,
            MaintenanceStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    ) {
        String sortField = (sortBy != null && sortBy.getField() != null) ? sortBy.getField() : "createdAt";

        // 2. Tạo đối tượng Pageable tự động phân trang và sort ở DB
        Pageable pageable = pageableUtils.createPageable(page, size, sortField, direction);

        // 3. Xử lý chuỗi keyword (Thêm ký tự % để tìm kiếm gần đúng)
        String processedKeyword = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            processedKeyword = "%" + keyword.trim() + "%"; // Không cần .toLowerCase() vì Repo dùng ILIKE
        }

        // 4. Gọi DB thực hiện quét với keyword tổng hợp
        Page<RepairRequest> requestPage = maintenanceRepository.findRequestsAdvanced(
                processedKeyword,
                severity,
                status,
                pageable
        );

        // 5. Map sang Response DTO trả về cho Frontend
        return requestPage.map(maintenanceMapper::toResponse);
    }


    /*
     * Chức năng:
     * Xóa yêu cầu bảo trì.
     *
     * Hiện tại là xóa cứng khỏi DB.
     * Nếu sau này muốn lưu lịch sử, có thể đổi sang soft delete.
     */
    @Override
    public void deleteRequest(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        messageSource.getMessage(
                                                ERROR_MAINTENANCE_NOTFOUND,
                                                new Object[]{id},
                                                locale
                                        )
                                ));

        maintenanceRepository.delete(repairRequest);
    }
}