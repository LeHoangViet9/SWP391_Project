package com.hms.service.maintenance.impl;

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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceMapper maintenanceMapper;
    private final PageableUtils pageableUtils;

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

        // SỬA MỚI:
        // Không cho tạo maintenance request nếu không gắn với phòng hoặc thiết bị.
        if (dto.getRoomId() == null && dto.getEquipmentId() == null) {
            throw new IllegalArgumentException(
                    "Maintenance request must be linked to a room or an equipment"
            );
        }

        // SỬA MỚI:
        // Nếu có roomId thì kiểm tra phòng đó có tồn tại trong DB không.
        if (dto.getRoomId() != null && !roomRepository.existsById(dto.getRoomId())) {
            throw new ResourceNotFoundException("Room not found");
        }

        // SỬA MỚI:
        // Nếu có equipmentId thì kiểm tra thiết bị đó có tồn tại trong DB không.
        if (dto.getEquipmentId() != null && !equipmentRepository.existsById(dto.getEquipmentId())) {
            throw new ResourceNotFoundException("Equipment not found");
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
                throw new IllegalArgumentException(
                        "Equipment is not assigned to this room"
                );
            }
        }

        RepairRequest repairRequest = maintenanceMapper.toEntity(dto);

        // Khi tạo mới, trạng thái mặc định luôn là PENDING.
        repairRequest.setStatus(MaintenanceStatus.PENDING);

        RepairRequest saved = maintenanceRepository.save(repairRequest);

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
    public MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto) {

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Maintenance request not found"
                                ));

        maintenanceMapper.updateFromDto(dto, repairRequest);

        // Nếu chuyển trạng thái sang COMPLETED thì lưu thời gian hoàn tất.
        if (dto.getStatus() == MaintenanceStatus.COMPLETED) {
            repairRequest.setCompletedAt(LocalDateTime.now());
        }

        // Nếu trạng thái khác COMPLETED thì không tự động xóa completedAt.
        // Tránh mất dữ liệu lịch sử nếu user update nhầm.

        RepairRequest updated = maintenanceRepository.save(repairRequest);

        return maintenanceMapper.toResponse(updated);
    }

    /*
     * Chức năng:
     * Lấy chi tiết một yêu cầu bảo trì theo id.
     */
    @Override
    public MaintenanceResponse getRequestById(Long id) {

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Maintenance request not found"
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
            Long id,
            String issueTitle,
            Long roomId,
            Long equipmentId,
            Long reportedBy,
            Long assignedTo,
            com.hms.common.enums.MaintenanceSeverity severity,
            com.hms.common.enums.MaintenanceStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    ) {
        List<RepairRequest> list = maintenanceRepository.findAll();
        java.util.stream.Stream<RepairRequest> stream = list.stream();

        if (id != null) {
            stream = stream.filter(r -> r.getId().equals(id));
        }

        if (org.springframework.util.StringUtils.hasText(issueTitle)) {
            String cleanTitle = issueTitle.trim().toLowerCase();
            stream = stream.filter(r ->
                    r.getIssueTitle() != null
                            && r.getIssueTitle().toLowerCase().contains(cleanTitle)
            );
        }

        if (roomId != null) {
            stream = stream.filter(r ->
                    r.getRoomId() != null
                            && r.getRoomId().equals(roomId)
            );
        }

        if (equipmentId != null) {
            stream = stream.filter(r ->
                    r.getEquipmentId() != null
                            && r.getEquipmentId().equals(equipmentId)
            );
        }

        if (reportedBy != null) {
            stream = stream.filter(r ->
                    r.getReportedBy() != null
                            && r.getReportedBy().equals(reportedBy)
            );
        }

        if (assignedTo != null) {
            stream = stream.filter(r ->
                    r.getAssignedTo() != null
                            && r.getAssignedTo().equals(assignedTo)
            );
        }

        if (severity != null) {
            stream = stream.filter(r -> r.getSeverity() == severity);
        }

        if (status != null) {
            stream = stream.filter(r -> r.getStatus() == status);
        }

        List<RepairRequest> filteredList =
                stream.collect(java.util.stream.Collectors.toList());

        // Sorting:
        // Khai báo các field có thể sort.
        java.util.Map<String, java.util.function.Function<RepairRequest, Comparable<?>>> extractors =
                new java.util.HashMap<>();

        extractors.put("id", RepairRequest::getId);
        extractors.put("issueTitle", RepairRequest::getIssueTitle);
        extractors.put("roomId", r -> r.getRoomId() != null ? r.getRoomId() : 0L);
        extractors.put("equipmentId", r -> r.getEquipmentId() != null ? r.getEquipmentId() : 0L);
        extractors.put("reportedBy", r -> r.getReportedBy() != null ? r.getReportedBy() : 0L);
        extractors.put("assignedTo", r -> r.getAssignedTo() != null ? r.getAssignedTo() : 0L);
        extractors.put("severity", r -> r.getSeverity() != null ? r.getSeverity().name() : "");
        extractors.put("status", r -> r.getStatus() != null ? r.getStatus().name() : "");
        extractors.put("createdAt", RepairRequest::getCreatedAt);

        pageableUtils.sortList(filteredList, sortBy, direction, extractors);

        Pageable pageable =
                pageableUtils.createPageable(page, size, sortBy.getField(), direction);

        return pageableUtils.paginate(filteredList, pageable)
                .map(maintenanceMapper::toResponse);
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

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Maintenance request not found"
                                ));

        maintenanceRepository.delete(repairRequest);
    }
}