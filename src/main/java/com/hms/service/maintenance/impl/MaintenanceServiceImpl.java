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
     *
     * THAY ĐỔI: Bổ sung loại trừ người tạo phiếu (reportedBy) khỏi danh sách ứng viên.
     * Trước đây: Chỉ loại trừ người đã từ chối → nhân viên tự tạo phiếu có thể bị
     *            hệ thống giao lại cho chính họ (vô nghĩa).
     * Sau khi sửa: Danh sách loại trừ = deniedByIds + reportedBy (nếu là MAINTENANCE staff).
     *              Đảm bảo người tạo phiếu không bao giờ tự nhận việc của chính mình.
     */
    private void autoAssignToMaintenance(RepairRequest request) {
        List<Long> deniedIds = new ArrayList<>(parseDeniedIds(request.getDeniedByIds()));

        /*
         * THÊM MỚI: Loại trừ người tạo phiếu (reportedBy) để tránh tự giao việc.
         * Trước đây: excludeIds = deniedIds (chỉ loại người đã từ chối)
         * Sau khi sửa: excludeIds = deniedIds + reportedBy
         * Lý do: Nếu nhân viên bảo trì A tự tạo phiếu, không được giao lại cho A.
         */
        if (request.getReportedBy() != null && !deniedIds.contains(request.getReportedBy())) {
            deniedIds.add(request.getReportedBy());
        }

        List<User> candidates = userRepository.findAvailableMaintenanceStaffExcluding(
                deniedIds.isEmpty() ? null : deniedIds);

        if (!candidates.isEmpty()) {
            User assignee = candidates.get(0);
            request.setAssignedTo(assignee.getId());
            request.setStatus(MaintenanceStatus.ASSIGNED);

            /*
             * THÊM MỚI: Ghi lại thời điểm giao việc (assignedAt).
             * Trước đây: Không lưu → không biết phiếu bị treo bao lâu.
             * Sau khi thêm: Scheduler sẽ so sánh assignedAt với now để tự động thu hồi sau 15 phút.
             */
            request.setAssignedAt(LocalDateTime.now());

            Locale locale = LocaleContextHolder.getLocale();
            // Gửi notification cho maintenance được giao
            String roomInfo = request.getRoomId() != null
                    ? messageSource.getMessage("maintenance.room.info", new Object[]{request.getRoomId()}, locale)
                    : messageSource.getMessage("maintenance.equipment.info", new Object[]{request.getEquipmentId()}, locale);

            String notifTitle = messageSource.getMessage("maintenance.notification.new.title", null, locale);
            String notifMsg = messageSource.getMessage("maintenance.notification.new.message", new Object[]{request.getId(), roomInfo}, locale);

            notificationService.notify(
                    assignee,
                    notifTitle,
                    notifMsg,
                    "/dashboard/maintenance"
            );

            // Đồng bộ trạng thái của nhân viên bảo trì sang WAITING_CONFIRM
            syncMaintenanceWorkStatus(assignee.getId(), MaintenanceStatus.ASSIGNED);
        } else {
            // Không có maintenance nào sẵn sàng → giữ PENDING, thông báo manager
            request.setStatus(MaintenanceStatus.PENDING);
            request.setAssignedTo(null);

            Locale locale = LocaleContextHolder.getLocale();
            String noStaffTitle = messageSource.getMessage("maintenance.notification.cannot_assign.title", null, locale);
            String noStaffMsg = messageSource.getMessage("maintenance.notification.cannot_assign.message", new Object[]{request.getId()}, locale);

            notificationService.notifyReceptionistsAndManagers(
                    noStaffTitle,
                    noStaffMsg,
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
            throw new ConflictException(messageSource.getMessage("error.maintenance.not.assigned.to.you", null, locale));
        }

        if (request.getStatus() != MaintenanceStatus.ASSIGNED) {
            throw new ConflictException(messageSource.getMessage("error.maintenance.invalid.status.assigned", null, locale));
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
    public MaintenanceResponse denyRequest(Long requestId, Long maintenanceUserId, String reason) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest request = maintenanceRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(ERROR_MAINTENANCE_NOTFOUND, new Object[]{requestId}, locale)));

        // Chỉ cho phép người được assign mới deny
        if (!maintenanceUserId.equals(request.getAssignedTo())) {
            throw new ConflictException(messageSource.getMessage("error.maintenance.not.assigned.to.you", null, locale));
        }

        if (request.getStatus() != MaintenanceStatus.ASSIGNED) {
            throw new ConflictException(messageSource.getMessage("error.maintenance.invalid.status.assigned", null, locale));
        }

        // THAY ĐỔI: Lưu lý do từ chối vào trường diagnosis
        if (reason != null && !reason.isBlank()) {
            String existingDiagnosis = request.getDiagnosis() != null ? request.getDiagnosis() : "";
            String reasonEntry = "[Từ chối] " + reason;
            request.setDiagnosis(existingDiagnosis.isBlank() ? reasonEntry : existingDiagnosis + "\n" + reasonEntry);
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

        /*
         * THÊM MỚI: Xóa assignedAt khi nhân viên từ chối.
         * Trước đây: Trường này chưa tồn tại.
         * Sau khi thêm: Đảm bảo phiếu trả về PENDING không bị scheduler thu hồi nhầm.
         */
        request.setAssignedAt(null);
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
        MaintenanceStatus oldStatus = repairRequest.getStatus();

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

        /*
         * THÊM MỚI: Gửi thông báo cho Quản lý & Lễ tân khi nhân viên bảo trì hoàn thành công việc.
         * Trước đây: Chỉ có tác vụ tự động quá hạn mới gửi thông báo hoàn thành. Hoàn thành thủ công không thông báo.
         * Sau khi sửa: Khi trạng thái vừa được đổi sang COMPLETED → Gửi thông báo hiển thị tên người làm và mã phòng/thiết bị.
         */
        if (updated.getStatus() == MaintenanceStatus.COMPLETED && oldStatus != MaintenanceStatus.COMPLETED) {
            String locationName = "";
            if (updated.getRoomId() != null) {
                locationName = roomRepository.findById(updated.getRoomId())
                        .map(r -> "phòng " + r.getRoomNumber())
                        .orElse("phòng #" + updated.getRoomId());
            } else if (updated.getEquipmentId() != null) {
                locationName = equipmentRepository.findById(updated.getEquipmentId())
                        .map(e -> "thiết bị " + e.getEquipmentName())
                        .orElse("thiết bị #" + updated.getEquipmentId());
            }

            String staffName = "N/A";
            if (updated.getAssignedTo() != null) {
                staffName = userRepository.findById(updated.getAssignedTo())
                        .map(User::getFullName)
                        .orElse("N/A");
            }

            String notifTitle = messageSource.getMessage(
                    "maintenance.notification.manual_complete.title",
                    new Object[]{locationName},
                    "🔧 Bảo trì hoàn thành cho " + locationName,
                    locale
            );
            String notifMsg = messageSource.getMessage(
                    "maintenance.notification.manual_complete.message",
                    new Object[]{updated.getId(), staffName},
                    "Yêu cầu bảo trì #" + updated.getId() + " đã hoàn thành bởi nhân viên " + staffName + ".",
                    locale
            );

            notificationService.notifyReceptionistsAndManagers(
                    notifTitle,
                    notifMsg,
                    "/dashboard/maintenance"
            );
        }

        // Đồng bộ trạng thái làm việc của nhân viên cũ và nhân viên mới (nếu có thay đổi)
        if (previousAssignee != null) {
            syncMaintenanceWorkStatus(previousAssignee, updated.getStatus());
        }
        if (updated.getAssignedTo() != null && !updated.getAssignedTo().equals(previousAssignee)) {
            syncMaintenanceWorkStatus(updated.getAssignedTo(), updated.getStatus());

            // THAY ĐỔI: Gửi notification cho nhân viên bảo trì mới được gán bởi manager
            final Locale notifLocale = locale;
            userRepository.findById(updated.getAssignedTo()).ifPresent(assignee -> {
                String roomInfo = updated.getRoomId() != null
                        ? messageSource.getMessage("maintenance.room.info", new Object[]{updated.getRoomId()}, notifLocale)
                        : messageSource.getMessage("maintenance.equipment.info", new Object[]{updated.getEquipmentId()}, notifLocale);
                String notifTitle = messageSource.getMessage("maintenance.notification.new.title", null, notifLocale);
                String notifMsg = messageSource.getMessage("maintenance.notification.assigned_by_manager.message",
                        new Object[]{updated.getId(), roomInfo}, notifLocale);
                notificationService.notify(
                        assignee,
                        notifTitle,
                        notifMsg,
                        "/dashboard/maintenance"
                );
            });
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

                        Locale locale = LocaleContextHolder.getLocale();
                        String notifTitle = messageSource.getMessage("maintenance.notification.auto_complete.title", new Object[]{room.getRoomNumber()}, locale);
                        String notifMsg = messageSource.getMessage("maintenance.notification.auto_complete.message", new Object[]{request.getId()}, locale);

                        // Gửi thông báo cho lễ tân & quản lý
                        notificationService.notifyReceptionistsAndManagers(
                                notifTitle,
                                notifMsg,
                                "/dashboard/maintenance"
                        );
                    }
                });
            }
        }
    }

    /*
     * THÊM MỚI: Scheduler tự động thu hồi việc nếu nhân viên KHÔNG bấm Nhận sau 15 phút.
     * Chức năng: Thay thế cho việc Quản lý phải vào gán lại bằng tay khi nhân viên bỏ quên.
     * Trước đây: Phiếu ASSIGNED bị treo vô thời hạn nếu nhân viên không phản hồi.
     * Sau khi thêm:
     *   - Chạy mỗi 60 giây (fixedRate = 60000).
     *   - Tìm các phiếu ASSIGNED có assignedAt quá 15 phút.
     *   - Tự động thêm nhân viên đó vào danh sách từ chối (deniedByIds).
     *   - Reset phiếu về PENDING và giao lại cho người tiếp theo qua autoAssignToMaintenance.
     *   - Gửi thông báo cho nhân viên bị thu hồi và quản lý.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60000)
    @Transactional
    public void autoRevokeStaleAssignments() {
        // Ngưỡng thời gian: phiếu giao quá 15 phút mà chưa được nhân viên bấm Nhận
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
        List<RepairRequest> staleRequests = maintenanceRepository.findStaleAssignedRequests(threshold);

        for (RepairRequest request : staleRequests) {
            Long timedOutUserId = request.getAssignedTo();

            // Thêm nhân viên không phản hồi vào danh sách từ chối để không giao lại
            List<Long> deniedIds = new ArrayList<>(parseDeniedIds(request.getDeniedByIds()));
            if (timedOutUserId != null && !deniedIds.contains(timedOutUserId)) {
                deniedIds.add(timedOutUserId);
            }
            request.setDeniedByIds(deniedIds.stream().map(String::valueOf).collect(Collectors.joining(",")));

            // Reset phiếu về PENDING để tự động giao lại
            request.setAssignedTo(null);
            request.setAssignedAt(null);
            request.setStatus(MaintenanceStatus.PENDING);
            maintenanceRepository.save(request);

            // Trả trạng thái nhân viên về AVAILABLE
            if (timedOutUserId != null) {
                syncMaintenanceWorkStatus(timedOutUserId, MaintenanceStatus.PENDING);

                // Gửi thông báo cho nhân viên bị thu hồi
                userRepository.findById(timedOutUserId).ifPresent(user -> {
                    Locale locale = LocaleContextHolder.getLocale();
                    String title = messageSource.getMessage("maintenance.notification.timeout.title", null, locale);
                    String msg = messageSource.getMessage("maintenance.notification.timeout.message",
                            new Object[]{request.getId()}, locale);
                    notificationService.notify(user, title, msg, "/dashboard/maintenance");
                });
            }

            // Thử giao cho người tiếp theo trong danh sách
            autoAssignToMaintenance(request);
            maintenanceRepository.save(request);
        }
    }
}