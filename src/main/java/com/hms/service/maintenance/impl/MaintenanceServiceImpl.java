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
import com.hms.entity.auth.User;
import com.hms.entity.maintenance.RepairRequest;
import com.hms.repository.equipment.EquipmentRepository;
import com.hms.repository.equipment.RoomEquipmentRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.maintenance.MaintenanceRepository;
import com.hms.repository.auth.UserRepository;
import com.hms.service.maintenance.MaintenanceService;
import com.hms.service.maintenance.mapper.MaintenanceMapper;
import com.hms.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.hms.common.exception.ConflictException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceMapper maintenanceMapper;
    private final PageableUtils pageableUtils;
    private final MessageSource messageSource;
    private final RoomRepository roomRepository;
    private final EquipmentRepository equipmentRepository;
    private final RoomEquipmentRepository roomEquipmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final String ERROR_MAINTENANCE_NOTFOUND = "error.maintenance.notfound";
    private static final String ERROR_ROOM_NOTFOUND = "error.room.notfound";
    private static final String ERROR_EQUIPMENT_NOTFOUND = "error.equipment.notfound";
    private static final String ERROR_EQUIPMENT_NOT_ASSIGNED = "error.equipment.not.assigned.room";
    private static final String ERROR_MAINTENANCE_ROOM_OR_EQUIPMENT_REQUIRED =
            "error.maintenance.room.or.equipment.required";

    /*
     * Tạo yêu cầu bảo trì mới và TỰ ĐỘNG giao cho maintenance AVAILABLE đầu tiên.
     * Gửi notification cho maintenance được giao.
     * Nếu không có ai sẵn sàng → trạng thái PENDING, thông báo manager.
     */
    @Override
    @Transactional
    public MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        // Không cho tạo maintenance request nếu không gắn với phòng hoặc thiết bị.
        if (dto.getRoomId() == null && dto.getEquipmentId() == null) {
            throw new ConflictException(
                    messageSource.getMessage(ERROR_MAINTENANCE_ROOM_OR_EQUIPMENT_REQUIRED, null, locale));
        }

        // Kiểm tra phòng tồn tại
        if (dto.getRoomId() != null && !roomRepository.existsById(dto.getRoomId())) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage(ERROR_ROOM_NOTFOUND, new Object[]{dto.getRoomId()}, locale));
        }

        // Kiểm tra thiết bị tồn tại
        if (dto.getEquipmentId() != null && !equipmentRepository.existsById(dto.getEquipmentId())) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage(ERROR_EQUIPMENT_NOTFOUND, new Object[]{dto.getEquipmentId()}, locale));
        }

        // Nếu có cả roomId và equipmentId, thiết bị phải được gán đúng phòng
        if (dto.getRoomId() != null && dto.getEquipmentId() != null) {
            boolean assigned = roomEquipmentRepository.existsByRoomIdAndEquipmentId(
                    dto.getRoomId(), dto.getEquipmentId());
            if (!assigned) {
                throw new ConflictException(
                        messageSource.getMessage(ERROR_EQUIPMENT_NOT_ASSIGNED, null, locale));
            }
        }

        RepairRequest repairRequest = maintenanceMapper.toEntity(dto);
        repairRequest.setStatus(MaintenanceStatus.PENDING);
        repairRequest.setDeniedByIds("");

        // Lưu lần đầu để có ID
        RepairRequest saved = maintenanceRepository.save(repairRequest);

        // Chuyển trạng thái phòng sang MAINTENANCE (nếu chưa ở trạng thái đó)
        if (saved.getRoomId() != null) {
            roomRepository.findById(saved.getRoomId()).ifPresent(room -> {
                if (room.getRoomStatus() != com.hms.common.enums.RoomStatus.MAINTENANCE) {
                    room.setRoomStatus(com.hms.common.enums.RoomStatus.MAINTENANCE);
                    roomRepository.save(room);
                }
            });
        }

        // TỰ ĐỘNG giao việc cho maintenance AVAILABLE đầu tiên
        autoAssignToMaintenance(saved);

        return enrich(maintenanceMapper.toResponse(maintenanceRepository.save(saved)));
    }

    /**
     * Tìm maintenance staff AVAILABLE và giao việc, gửi notification.
     */
    private void autoAssignToMaintenance(RepairRequest request) {
        List<Long> deniedIds = parseDeniedIds(request.getDeniedByIds());
        List<User> candidates = userRepository.findAvailableMaintenanceStaffExcluding(
                deniedIds.isEmpty() ? null : deniedIds);

        if (!candidates.isEmpty()) {
            User assignee = candidates.get(0);
            request.setAssignedTo(assignee.getId());
            request.setStatus(MaintenanceStatus.ASSIGNED);

            // Gửi notification cho maintenance được giao
            String roomInfo = request.getRoomId() != null
                    ? "phòng #" + request.getRoomId()
                    : "thiết bị #" + request.getEquipmentId();

            notificationService.notify(
                    assignee,
                    "📋 Yêu cầu sửa chữa mới",
                    "Bạn được giao yêu cầu sửa chữa #" + request.getId()
                            + " tại " + roomInfo + ". Vui lòng xem và xác nhận.",
                    "/dashboard/maintenance"
            );

            // Đồng bộ trạng thái của nhân viên bảo trì sang WAITING_CONFIRM
            syncMaintenanceWorkStatus(assignee.getId(), MaintenanceStatus.ASSIGNED);
        } else {
            // Không có maintenance nào sẵn sàng → giữ PENDING, thông báo manager
            request.setStatus(MaintenanceStatus.PENDING);
            request.setAssignedTo(null);
            notificationService.notifyReceptionistsAndManagers(
                    "⚠️ Không thể giao yêu cầu sửa chữa",
                    "Yêu cầu sửa chữa #" + request.getId()
                            + " không thể giao vì không có nhân viên maintenance nào sẵn sàng.",
                    "/dashboard/maintenance"
            );
        }
    }

    /*
     * Maintenance staff CHẤP NHẬN yêu cầu → chuyển sang IN_PROGRESS
     */
    @Override
    @Transactional
    public MaintenanceResponse acceptRequest(Long requestId, Long maintenanceUserId) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest request = maintenanceRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_MAINTENANCE_NOTFOUND, new Object[]{requestId}, locale)));

        // Chỉ cho phép người được assign mới accept
        if (!maintenanceUserId.equals(request.getAssignedTo())) {
            throw new ConflictException("Bạn không được giao yêu cầu này.");
        }

        if (request.getStatus() != MaintenanceStatus.ASSIGNED) {
            throw new ConflictException("Yêu cầu không ở trạng thái ASSIGNED.");
        }

        request.setStatus(MaintenanceStatus.IN_PROGRESS);
        RepairRequest saved = maintenanceRepository.save(request);
        
        // Đồng bộ trạng thái làm việc của nhân viên bảo trì sang WORKING
        syncMaintenanceWorkStatus(maintenanceUserId, MaintenanceStatus.IN_PROGRESS);
        
        return enrich(maintenanceMapper.toResponse(saved));
    }

    /*
     * Maintenance staff TỪ CHỐI yêu cầu → lưu vào deniedByIds, giao cho người tiếp theo.
     * Nếu hết người → giữ PENDING, thông báo manager.
     */
    @Override
    @Transactional
    public MaintenanceResponse denyRequest(Long requestId, Long maintenanceUserId) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest request = maintenanceRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_MAINTENANCE_NOTFOUND, new Object[]{requestId}, locale)));

        // Chỉ cho phép người được assign mới deny
        if (!maintenanceUserId.equals(request.getAssignedTo())) {
            throw new ConflictException("Bạn không được giao yêu cầu này.");
        }

        if (request.getStatus() != MaintenanceStatus.ASSIGNED) {
            throw new ConflictException("Yêu cầu không ở trạng thái ASSIGNED.");
        }

        // Thêm người từ chối vào deniedByIds
        List<Long> deniedIds = new ArrayList<>(parseDeniedIds(request.getDeniedByIds()));
        if (!deniedIds.contains(maintenanceUserId)) {
            deniedIds.add(maintenanceUserId);
        }
        request.setDeniedByIds(deniedIds.stream().map(String::valueOf).collect(Collectors.joining(",")));

        // Reset assigned
        request.setAssignedTo(null);
        request.setStatus(MaintenanceStatus.PENDING);
        maintenanceRepository.save(request);

        // Đồng bộ trạng thái của nhân viên bảo trì vừa từ chối
        syncMaintenanceWorkStatus(maintenanceUserId, MaintenanceStatus.PENDING);

        // Tìm người tiếp theo (loại trừ tất cả người đã từ chối)
        autoAssignToMaintenance(request);

        return enrich(maintenanceMapper.toResponse(maintenanceRepository.save(request)));
    }

    /**
     * Parse danh sách ID từ chuỗi CSV "5,8,12"
     */
    private List<Long> parseDeniedIds(String deniedByIds) {
        if (deniedByIds == null || deniedByIds.isBlank()) return new ArrayList<>();
        return Arrays.stream(deniedByIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    /*
     * Cập nhật yêu cầu bảo trì (dành cho manager/admin chỉnh sửa thủ công).
     */
    @Override
    @Transactional
    public MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        messageSource.getMessage(
                                                ERROR_MAINTENANCE_NOTFOUND, new Object[]{id}, locale)));

        Long previousAssignee = repairRequest.getAssignedTo();

        maintenanceMapper.updateFromDto(dto, repairRequest);

        // Khi COMPLETED hoặc CANCELLED → cập nhật lại phòng về AVAILABLE
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

        // Đồng bộ trạng thái làm việc của nhân viên cũ và nhân viên mới (nếu có thay đổi)
        if (previousAssignee != null) {
            syncMaintenanceWorkStatus(previousAssignee, updated.getStatus());
        }
        if (updated.getAssignedTo() != null && !updated.getAssignedTo().equals(previousAssignee)) {
            syncMaintenanceWorkStatus(updated.getAssignedTo(), updated.getStatus());
        }

        return enrich(maintenanceMapper.toResponse(updated));
    }

    @Override
    @Transactional(readOnly = true)
    public MaintenanceResponse getRequestById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        messageSource.getMessage(
                                                ERROR_MAINTENANCE_NOTFOUND, new Object[]{id}, locale)));
        return enrich(maintenanceMapper.toResponse(repairRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MaintenanceResponse> getAllRequests(
            String keyword,
            MaintenanceSeverity severity,
            MaintenanceStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    ) {
        String sortField = (sortBy != null && sortBy.getField() != null) ? sortBy.getField() : "createdAt";
        Pageable pageable = pageableUtils.createPageable(page, size, sortField, direction);

        String processedKeyword = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            processedKeyword = "%" + keyword.trim() + "%";
        }

        // Lọc theo nhân viên kỹ thuật đang đăng nhập (chỉ xem việc được giao cho mình)
        Long filterAssignedTo = null;
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String) {
            String email = (String) auth.getPrincipal();
            java.util.Optional<User> currentUserOpt = userRepository.findUserByEmail(email);
            if (currentUserOpt.isPresent()) {
                User currentUser = currentUserOpt.get();
                if (currentUser.getRole() != null && "MAINTENANCE".equalsIgnoreCase(currentUser.getRole().getRoleName())) {
                    filterAssignedTo = currentUser.getId();
                }
            }
        }

        Page<RepairRequest> requestPage = maintenanceRepository.findRequestsAdvanced(
                processedKeyword, severity, status, filterAssignedTo, pageable);

        return requestPage.map(req -> enrich(maintenanceMapper.toResponse(req)));
    }

    @Override
    public void deleteRequest(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        messageSource.getMessage(
                                                ERROR_MAINTENANCE_NOTFOUND, new Object[]{id}, locale)));
        maintenanceRepository.delete(repairRequest);
    }

    /**
     * Đồng bộ trạng thái làm việc (StaffWorkStatus) của nhân viên kỹ thuật (Maintenance)
     */
    private void syncMaintenanceWorkStatus(Long maintenanceUserId, MaintenanceStatus taskStatus) {
        if (maintenanceUserId == null) {
            return;
        }

        userRepository.findById(maintenanceUserId).ifPresent(user -> {
            if (user.getWorkStatus() == com.hms.common.enums.StaffWorkStatus.OFF) {
                return;
            }

            boolean hasInProgress = maintenanceRepository.existsByAssignedToAndStatus(
                    maintenanceUserId,
                    MaintenanceStatus.IN_PROGRESS
            );

            if (hasInProgress) {
                user.setWorkStatus(com.hms.common.enums.StaffWorkStatus.WORKING);
            } else {
                boolean hasAssigned = maintenanceRepository.existsByAssignedToAndStatus(
                        maintenanceUserId,
                        MaintenanceStatus.ASSIGNED
                );
                if (hasAssigned) {
                    user.setWorkStatus(com.hms.common.enums.StaffWorkStatus.WAITING_CONFIRM);
                } else {
                    user.setWorkStatus(com.hms.common.enums.StaffWorkStatus.AVAILABLE);
                }
            }
            userRepository.save(user);
        });
    }

    /**
     * Bổ sung thông tin tên đầy đủ và vai trò của người báo cáo / người được phân công
     */
    private MaintenanceResponse enrich(MaintenanceResponse res) {
        if (res == null) {
            return null;
        }
        if (res.getReportedBy() != null) {
            userRepository.findById(res.getReportedBy()).ifPresent(u -> {
                String role = u.getRole() != null ? u.getRole().getRoleName() : "N/A";
                res.setReportedByName(u.getFullName() + " (" + role + ")");
            });
        }
        if (res.getAssignedTo() != null) {
            userRepository.findById(res.getAssignedTo()).ifPresent(u -> {
                res.setAssignedToName(u.getFullName());
            });
        }
        return res;
    }

    /**
     * Tự động hoàn thành bảo trì & giải phóng phòng sang AVAILABLE khi thời gian dự kiến hoàn thành trôi qua
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60000)
    @Transactional
    public void autoReleaseExpiredMaintenanceRooms() {
        LocalDateTime now = LocalDateTime.now();
        List<RepairRequest> expiredRequests = maintenanceRepository.findExpiredActiveRequests(
                List.of(MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED),
                now
        );

        for (RepairRequest request : expiredRequests) {
            if (request.getRoomId() != null) {
                roomRepository.findById(request.getRoomId()).ifPresent(room -> {
                    // Nếu phòng đang ở trạng thái MAINTENANCE, tự động chuyển về AVAILABLE
                    if (room.getRoomStatus() == com.hms.common.enums.RoomStatus.MAINTENANCE) {
                        room.setRoomStatus(com.hms.common.enums.RoomStatus.AVAILABLE);
                        roomRepository.save(room);
                        
                        // Cập nhật RepairRequest thành COMPLETED
                        request.setStatus(MaintenanceStatus.COMPLETED);
                        request.setCompletedAt(now);
                        maintenanceRepository.save(request);

                        // Đồng bộ lại trạng thái của nhân viên sửa chữa
                        if (request.getAssignedTo() != null) {
                            syncMaintenanceWorkStatus(request.getAssignedTo(), MaintenanceStatus.COMPLETED);
                        }

                        // Gửi thông báo cho lễ tân & quản lý
                        notificationService.notifyReceptionistsAndManagers(
                                "🔧 Tự động hoàn tất bảo trì phòng " + room.getRoomNumber(),
                                "Yêu cầu sửa chữa #" + request.getId() + " đã tự động hoàn thành do quá thời hạn dự kiến. Trạng thái phòng được chuyển về Sẵn sàng.",
                                "/dashboard/maintenance"
                        );
                    }
                });
            }
        }
    }
}