package com.hms.service.housekeeping.impl;

import com.hms.common.enums.*;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.request.MinibarReportRequest;
import com.hms.dto.housekeeping.request.ReportRoomIssueRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.dto.housekeeping.response.RoomStateHistoryResponse;
import com.hms.entity.auth.User;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomStateHistory;
import com.hms.entity.housekeeping.HouseKeepingTask;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.housekeeping.HouseKeepingTaskRepository;
import com.hms.repository.housekeeping.RoomStateHistoryRepository;
import com.hms.service.checkout.CheckoutService;
import com.hms.service.housekeeping.IHouseKeepingTaskService;
import com.hms.service.housekeeping.mapper.HouseKeepingTaskMapper;
import com.hms.service.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import com.hms.service.notification.NotificationService;
import com.hms.service.maintenance.MaintenanceService;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.common.enums.MaintenanceSeverity;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import java.time.LocalDate;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class HouseKeepingTaskServiceImpl implements IHouseKeepingTaskService {

    private final HouseKeepingTaskRepository taskRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomStateHistoryRepository roomStateHistoryRepository;
    private final HouseKeepingTaskMapper taskMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final BookingRepository bookingRepository;

    /*
     * THAY ĐỔI: Chuyển MaintenanceService từ final field (inject qua Lombok constructor)
     * sang @Autowired @Lazy để phá vỡ circular dependency:
     *   HouseKeepingTaskServiceImpl → MaintenanceService
     *   MaintenanceServiceImpl (cần @Scheduled, không inject HouseKeepingTask)
     * Trước đây: Lỗi "required a bean of type MaintenanceService that could not be found"
     * Sau khi sửa: Spring tạo proxy lười, không bị vòng tròn phụ thuộc.
     */
    @Autowired
    @Lazy
    private MaintenanceService maintenanceService;

    @Autowired
    @Lazy
    private CheckoutService checkoutService;

    @Override
    @Transactional(readOnly = true)
    public Page<HouseKeepingTaskResponse> searchTasks(TaskStatus status, Long assignedToId, Long assignedById, Long roomId, LocalDate fromDate, LocalDate toDate, Integer page, Integer size, SortField sortField, SortDirection direction) {
        String sortBy = sortField != null
                ? sortField.getField()
                : "createdAt";

        Pageable pageable = pageableUtils.createPageable(page, size, sortBy, direction);
        // Use typed bounds instead of nullable JPQL parameters. PostgreSQL cannot
        // infer the type of parameters used only in an "IS NULL" expression.
        LocalDateTime from = fromDate == null
                ? LocalDateTime.of(1900, 1, 1, 0, 0)
                : fromDate.atStartOfDay();
        LocalDateTime to = toDate == null
                ? LocalDateTime.of(9999, 12, 31, 23, 59, 59)
                : toDate.plusDays(1).atStartOfDay();
        return taskRepository.searchTasks(status, Collections.emptyList(), false, assignedToId, assignedById, roomId, from, to, pageable)
                .map(taskMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public HouseKeepingTaskResponse getTaskById(Long id) {
        HouseKeepingTask task = findTaskById(id);
        return taskMapper.toResponse(task);
    }

    @Override
    @Transactional
    public HouseKeepingTaskResponse createTask(HouseKeepingTaskRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.room.notfound", null, locale)));

        User assignedTo = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.notfound", null, locale)));
        validateAssignableHousekeeper(assignedTo, locale);

        User assignedBy = userRepository.findById(request.getAssignedById())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.notfound", null, locale)));

        ensureNoActiveTaskForRoom(room.getId(), locale);

        TaskStatus initialStatus = (request.getStartedAt() != null
                && !request.getStartedAt().isAfter(LocalDateTime.now()))
                ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING;
        HouseKeepingTask task = HouseKeepingTask.builder()
                .room(room)
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .taskStatus(initialStatus)
                .notes(request.getNotes())
                .startedAt(request.getStartedAt())
                .build();

        HouseKeepingTask saved = taskRepository.save(task);
        syncHousekeeperWorkStatus(saved.getAssignedTo(), saved.getTaskStatus());

        // Chuyển sang RoomStatus.CLEANING khi tạo task dọn phòng
        if (saved.getTaskStatus() == TaskStatus.IN_PROGRESS) {
            changeRoomStatus(
                    room,
                    RoomStatus.CLEANING,
                    assignedBy,
                    saved,
                    "Task bắt đầu dọn phòng",
                    ProcessTrigger.TASK_CLEANING
            );
        }

        // Gửi email thông báo cho housekeeper được gán task
        sendTaskNotification(assignedTo, room.getRoomNumber(), request.getNotes());
        sendInAppTaskNotification(assignedTo, room.getRoomNumber(), request.getNotes());

        return taskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public HouseKeepingTaskResponse updateTask(Long id, HouseKeepingTaskUpdateRequest request) {
        HouseKeepingTask task = findTaskById(id);

        if (request.getNotes() != null) {
            task.setNotes(request.getNotes());
        }

        if (request.getTaskStatus() == null) {
            return taskMapper.toResponse(taskRepository.save(task));
        }

        TaskStatus oldStatus = task.getTaskStatus();
        TaskStatus newStatus = request.getTaskStatus();

        if (oldStatus == newStatus) {
            return taskMapper.toResponse(taskRepository.save(task));
        }

        validateTaskTransition(oldStatus, newStatus);

        task.setTaskStatus(newStatus);
        updateBusinessTimestamps(task, request, newStatus);

        HouseKeepingTask updated = taskRepository.save(task);

        // Cập nhật trạng thái phòng dựa trên trạng thái task mới
        updateRoomStatusByTaskStatus(updated, newStatus);
        syncHousekeeperWorkStatus(updated.getAssignedTo(), newStatus);
        if (newStatus == TaskStatus.CANCELLED) {
            reassignCancelledTask(updated);
        }

        return taskMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        HouseKeepingTask task = findTaskById(id);

        // THÊM: không cho xóa task đang chạy
        if (task.getTaskStatus() == TaskStatus.IN_PROGRESS
                || task.getTaskStatus() == TaskStatus.COMPLETED) {

            String errorMessage = messageSource.getMessage(
                    "error.task.inprogress.delete",
                    null,
                    locale
            );

            throw new IllegalArgumentException(errorMessage);
        }

        taskRepository.delete(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HouseKeepingTaskResponse> getPendingTasksByRoom(Long roomId) {
        return taskMapper.toResponseList(
                taskRepository.findByRoom_IdAndTaskStatus(roomId, TaskStatus.PENDING));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HouseKeepingTaskResponse> getUncompletedTasksByUser(Long userId) {
        return taskMapper.toResponseList(
                taskRepository.findByAssignedTo_IdAndTaskStatusIn(
                        userId, List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS)));
    }


    @Override
    @Transactional(readOnly = true)
    public Page<RoomStateHistoryResponse> getRoomStateHistory(Long roomId,Integer page, Integer size,SortField sortField,SortDirection sortDirection) {
        String sortBy = sortField != null
                ? sortField.getField()
                : "createdAt";
        Pageable pageable=pageableUtils.createPageable(page,size,sortBy,sortDirection);
        Page<RoomStateHistory> historyPage=  roomStateHistoryRepository.findByRoomIdWithDetails(roomId,pageable);
        return historyPage.map(this::toRoomStateHistoryResponse);
    }

    // ==================== PRIVATE HELPERS ====================

    private void validateTaskTransition(
            TaskStatus oldStatus,
            TaskStatus newStatus) {

        if (oldStatus == TaskStatus.COMPLETED) {
            throw new IllegalStateException(
                    "task.completed.error");
        }

        if (oldStatus == TaskStatus.CANCELLED) {
            throw new IllegalStateException(
                    "task.cancelled.error");
        }
    }

    private RoomStateHistoryResponse toRoomStateHistoryResponse(RoomStateHistory history) {
        User changedBy = history.getTriggeredByUser();
        HouseKeepingTask task = history.getTask();
        return RoomStateHistoryResponse.builder()
                .id(history.getId())
                .roomId(history.getRoom().getId())
                .roomNumber(history.getRoom().getRoomNumber())
                .previousState(history.getPreviousState())
                .currentState(history.getCurrentState())
                .triggeredByUserName(changedBy != null ? changedBy.getFullName() : null)
                .taskId(task != null ? task.getId() : null)
                .changedAt(history.getChangedAt())
                .reason(history.getReason())
                .build();
    }

    private HouseKeepingTask findTaskById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        return taskRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.task.notfound", null, locale)));
    }

    private void updateBusinessTimestamps(HouseKeepingTask task, HouseKeepingTaskUpdateRequest request, TaskStatus newStatus) {
        switch (newStatus) {
            case IN_PROGRESS:
                task.setStartedAt(request.getStartedAt() != null ? request.getStartedAt() : LocalDateTime.now());
                break;
            case COMPLETED:
                if (task.getStartedAt() == null) {
                    task.setStartedAt(request.getStartedAt() != null ? request.getStartedAt() : LocalDateTime.now());
                }
                task.setCompletedAt(LocalDateTime.now());
                break;
            case CANCELLED:
            case SKIPPED:
                break;
            default:
                break;
        }
    }

    private void updateRoomStatusByTaskStatus(HouseKeepingTask task, TaskStatus newStatus) {
        Room room = task.getRoom();
        switch (newStatus) {
            case IN_PROGRESS:
                changeRoomStatus(room, RoomStatus.CLEANING, task.getAssignedTo(), task, "Task bắt đầu dọn phòng", ProcessTrigger.TASK_CLEANING);
                break;
            case COMPLETED:
                changeRoomStatus(room, RoomStatus.READY, task.getAssignedTo(), task, "Task hoàn thành", ProcessTrigger.TASK_COMPLETION);
                break;
            case CANCELLED:
                changeRoomStatus(room, RoomStatus.DIRTY, task.getAssignedTo(), task, "Task bị hủy", ProcessTrigger.TASK_CANCELLATION);
                break;
            case SKIPPED:
                changeRoomStatus(room, RoomStatus.DIRTY, task.getAssignedTo(), task, "Task bị bỏ qua", ProcessTrigger.TASK_SKIPPED);
                break;
            default:
                break;
        }
    }

    private void ensureNoActiveTaskForRoom(Long roomId, Locale locale) {
        boolean hasActiveTask = taskRepository.existsByRoom_IdAndTaskStatusIn(
                roomId,
                List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS)
        );
        if (hasActiveTask) {
            throw new ConflictException(messageSource.getMessage("error.task.room.active.exists", null, locale));
        }
    }

    private void validateAssignableHousekeeper(User user, Locale locale) {
        String roleName = user.getRole() == null ? null : user.getRole().getRoleName();
        if (!"HOUSEKEEPER".equalsIgnoreCase(roleName) || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ConflictException(messageSource.getMessage("error.housekeeper.invalid", null, locale));
        }
        if (user.getWorkStatus() == StaffWorkStatus.OFF) {
            throw new ConflictException(messageSource.getMessage("error.housekeeper.notavailable", null, locale));
        }
    }

    private void syncHousekeeperWorkStatus(User housekeeper, TaskStatus taskStatus) {
        if (housekeeper == null || housekeeper.getWorkStatus() == StaffWorkStatus.OFF) {
            return;
        }

        boolean hasInProgress = taskRepository.existsByAssignedTo_IdAndTaskStatus(
                housekeeper.getId(),
                TaskStatus.IN_PROGRESS
        );

        if (hasInProgress) {
            housekeeper.setWorkStatus(StaffWorkStatus.WORKING);
        } else {
            boolean hasPending = taskRepository.existsByAssignedTo_IdAndTaskStatus(
                    housekeeper.getId(),
                    TaskStatus.PENDING
            );
            if (hasPending) {
                housekeeper.setWorkStatus(StaffWorkStatus.WAITING_CONFIRM);
            } else {
                housekeeper.setWorkStatus(StaffWorkStatus.AVAILABLE);
            }
        }
        userRepository.save(housekeeper);
    }

    /**
     * Reconcile trạng thái nhân viên với các task hiện có, bao gồm dữ liệu
     * được tạo trực tiếp bằng SQL hoặc tồn tại trước khi logic đồng bộ được thêm.
     */
    @Scheduled(fixedRate = 60000, initialDelay = 1000)
    @Transactional
    public void reconcileHousekeeperWorkStatuses() {
        for (User housekeeper : userRepository.findActiveHousekeepers()) {
            syncHousekeeperWorkStatus(housekeeper, null);
        }
    }


    private void changeRoomStatus(Room room, RoomStatus newStatus, User changedBy,
                                  HouseKeepingTask task, String reason, ProcessTrigger processName) {
        RoomStatus previousStatus = room.getRoomStatus();

        if (previousStatus == newStatus) {
            return;
        }

        // Bảo vệ: không cho housekeeping ghi đè trạng thái của module khác
        if (processName != ProcessTrigger.TASK_MAINTENANCE
                && (previousStatus == RoomStatus.OCCUPIED
                || previousStatus == RoomStatus.MAINTENANCE)) {

            log.warn(
                    "Skipping room status change for room {}: currently {}",
                    room.getId(),
                    previousStatus
            );

            return;
        }

        room.setRoomStatus(newStatus);
        roomRepository.save(room);

        RoomStateHistory history = RoomStateHistory.builder()
                .room(room)
                .previousState(previousStatus)
                .currentState(newStatus)
                .triggeredByUser(changedBy)
                .task(task)
                .changedAt(LocalDateTime.now())
                .reason(reason)
                .triggeredByProcess(processName)
                .build();

        roomStateHistoryRepository.save(history);
    }
    @Override
    @Transactional
    public void reportRoomIssue(Long roomId, ReportRoomIssueRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.room.notfound", null, locale)));

        User reportedBy = null;
        if (request.getReportedById() != null) {
            reportedBy = userRepository.findById(request.getReportedById())
                    .orElse(null);
        }

        // Đổi trạng thái phòng thành MAINTENANCE và ghi nhận lịch sử
        changeRoomStatus(room, RoomStatus.MAINTENANCE, reportedBy, null, request.getReason(), ProcessTrigger.TASK_MAINTENANCE);

        // Tạo RepairRequest và TỰ ĐỘNG giao cho maintenance AVAILABLE
        // (MaintenanceService.createRequest sẽ handle auto-assign và notification)
        try {
            MaintenanceSeverity severity;
            try {
                severity = request.getSeverity() != null
                        ? MaintenanceSeverity.valueOf(request.getSeverity().toUpperCase())
                        : MaintenanceSeverity.MEDIUM;
            } catch (IllegalArgumentException e) {
                severity = MaintenanceSeverity.MEDIUM;
            }

            MaintenanceRequestCreateDTO dto = MaintenanceRequestCreateDTO.builder()
                    .roomId(roomId)
                    .reportedBy(request.getReportedById() != null ? request.getReportedById() : 0L)
                    .issueTitle("Sự cố phòng " + room.getRoomNumber())
                    .issueDescription(request.getReason())
                    .severity(severity)
                    .build();

            maintenanceService.createRequest(dto);
        } catch (Exception ex) {
            log.warn("[REPORT-ISSUE] Tạo RepairRequest thất bại cho phòng {}: {}", roomId, ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void autoCreateCleaningTaskOnCheckout(Long roomId, Long triggeredByUserId) {
        Locale locale = LocaleContextHolder.getLocale();

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.room.notfound", null, locale)));

        // Chọn ngẫu nhiên một housekeeper ACTIVE + AVAILABLE.
        if (taskRepository.existsByRoom_IdAndTaskStatusIn(roomId, List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS))) {
            log.info("[AUTO-ASSIGN] Room {} already has active housekeeping task. Skip auto-create.",
                    room.getRoomNumber());
            return;
        }

        List<User> housekeepers = userRepository.findHousekeepersOrderByTaskCountAsc();

        if (housekeepers.isEmpty()) {
            log.warn("[AUTO-ASSIGN] No AVAILABLE housekeeper found for room {}. " +
                     "Task will NOT be auto-created. Please assign manually.", room.getRoomNumber());
            return;
        }

        User assignedHousekeeper = housekeepers.get(0);

        // Xác định user thực hiện checkout (assignedBy)
        User assignedBy = null;
        if (triggeredByUserId != null) {
            assignedBy = userRepository.findById(triggeredByUserId).orElse(null);
        }
        if (assignedBy == null) {
            assignedBy = assignedHousekeeper; // fallback: self-assigned
        }

        String notes = "Auto-created on checkout — Room " + room.getRoomNumber();

        HouseKeepingTask task = HouseKeepingTask.builder()
                .room(room)
                .assignedTo(assignedHousekeeper)
                .assignedBy(assignedBy)
                .taskStatus(TaskStatus.PENDING)
                .notes(notes)
                .build();

        HouseKeepingTask saved = taskRepository.save(task);

        log.info("[AUTO-ASSIGN] Created cleaning task #{} for room {} -> assigned to {} (ID: {})",
                saved.getId(), room.getRoomNumber(),
                assignedHousekeeper.getFullName(), assignedHousekeeper.getId());

        // Gửi email thông báo cho housekeeper
        sendTaskNotification(assignedHousekeeper, room.getRoomNumber(), notes);
        sendInAppTaskNotification(assignedHousekeeper, room.getRoomNumber(), notes);

        // Đồng bộ trạng thái làm việc của housekeeper (sẽ thành WAITING_CONFIRM)
        syncHousekeeperWorkStatus(assignedHousekeeper, TaskStatus.PENDING);
    }

    private void reassignCancelledTask(HouseKeepingTask cancelledTask) {
        if (cancelledTask.getRoom() == null) {
            return;
        }

        User previousAssignee = cancelledTask.getAssignedTo();
        Long excludedUserId = previousAssignee == null ? null : previousAssignee.getId();
        List<User> candidates = userRepository.findHousekeepersOrderByTaskCountAscExcluding(excludedUserId);

        if (candidates.isEmpty()) {
            log.warn("[AUTO-REASSIGN] No AVAILABLE replacement housekeeper found for cancelled task #{} in room {}.",
                    cancelledTask.getId(), cancelledTask.getRoom().getRoomNumber());
            return;
        }

        User newAssignee = candidates.get(0);
        User assignedBy = cancelledTask.getAssignedBy() != null
                ? cancelledTask.getAssignedBy()
                : newAssignee;
        String notes = "Reassigned after cancellation - Room " + cancelledTask.getRoom().getRoomNumber();

        HouseKeepingTask reassignedTask = taskRepository.save(HouseKeepingTask.builder()
                .room(cancelledTask.getRoom())
                .assignedTo(newAssignee)
                .assignedBy(assignedBy)
                .taskStatus(TaskStatus.PENDING)
                .notes(notes)
                .build());

        log.info("[AUTO-REASSIGN] Created replacement cleaning task #{} for room {} -> assigned to {} (ID: {})",
                reassignedTask.getId(), cancelledTask.getRoom().getRoomNumber(),
                newAssignee.getFullName(), newAssignee.getId());

        sendTaskNotification(newAssignee, cancelledTask.getRoom().getRoomNumber(), notes);
        sendInAppTaskNotification(newAssignee, cancelledTask.getRoom().getRoomNumber(), notes);

        // Đồng bộ trạng thái cho cả housekeeper cũ (vừa từ chối) và housekeeper mới (được reassign)
        if (previousAssignee != null) {
            syncHousekeeperWorkStatus(previousAssignee, TaskStatus.CANCELLED);
        }
        syncHousekeeperWorkStatus(newAssignee, TaskStatus.PENDING);
    }

    /**
     * Gửi email thông báo gán task cho housekeeper (async-safe, không throw exception).
     */
    private void sendTaskNotification(User housekeeper, String roomNumber, String notes) {
        try {
            emailService.sendTaskAssignmentNotification(
                    housekeeper.getEmail(),
                    housekeeper.getFullName(),
                    roomNumber,
                    notes
            );
        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to send task assignment email to {} : {}",
                    housekeeper.getEmail(), e.getMessage());
        }
    }

    private void sendInAppTaskNotification(User housekeeper, String roomNumber, String notes) {
        try {
            notificationService.notify(
                    housekeeper,
                    "Bạn có nhiệm vụ buồng phòng mới",
                    "Phòng " + roomNumber + " vừa được gán cho bạn."
                            + (notes == null || notes.isBlank() ? "" : " Ghi chú: " + notes),
                    "/dashboard/housekeeping"
            );
        } catch (Exception e) {
            log.warn("[NOTIFICATION] Failed to create in-app task notification for {} : {}",
                    housekeeper != null ? housekeeper.getEmail() : null,
                    e.getMessage());
        }
    }

    @Override
    @Transactional
    public void reportMinibar(Long id, MinibarReportRequest request) {
        HouseKeepingTask task = findTaskById(id);
        Room room = task.getRoom();

        com.hms.entity.booking.Booking booking = bookingRepository.findActiveBookingByRoomId(room.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng đang hoạt động cho phòng này"));

        java.math.BigDecimal waterCost = java.math.BigDecimal.valueOf(request.getWater()).multiply(java.math.BigDecimal.valueOf(10000));
        java.math.BigDecimal colaCost = java.math.BigDecimal.valueOf(request.getCola()).multiply(java.math.BigDecimal.valueOf(20000));
        java.math.BigDecimal beerCost = java.math.BigDecimal.valueOf(request.getBeer()).multiply(java.math.BigDecimal.valueOf(35000));
        java.math.BigDecimal snackCost = java.math.BigDecimal.valueOf(request.getSnack()).multiply(java.math.BigDecimal.valueOf(15000));
        java.math.BigDecimal total = waterCost.add(colaCost).add(beerCost).add(snackCost);

        List<String> items = new java.util.ArrayList<>();
        if (request.getWater() > 0) items.add(request.getWater() + " Nước suối Aquafina");
        if (request.getCola() > 0) items.add(request.getCola() + " Coca-Cola / Pepsi");
        if (request.getBeer() > 0) items.add(request.getBeer() + " Bia Heineken");
        if (request.getSnack() > 0) items.add(request.getSnack() + " Snack khoai tây");
        String note = String.join(", ", items);

        com.hms.dto.checkout.request.CheckoutRequestDTO checkoutRequest = new com.hms.dto.checkout.request.CheckoutRequestDTO();
        checkoutRequest.setBookingId(booking.getId());
        checkoutRequest.setAdditionalCharges(total);
        Locale locale = LocaleContextHolder.getLocale();
        String resolvedNoteText = note.isEmpty()
                ? messageSource.getMessage("checkout.minibar.no_consumption", null, locale)
                : note;
        checkoutRequest.setChargeNote("Tiêu thụ Minibar: " + resolvedNoteText);
        checkoutRequest.setPaymentMethod(null);
        checkoutRequest.setCashReceived(null);
        checkoutRequest.setPaymentConfirmed(false);

        checkoutService.confirmPayment(checkoutRequest, null);

        // Gửi thông báo cho lễ tân và quản lý về báo cáo minibar
        String notifTitle = messageSource.getMessage("notification.minibar.report.title", new Object[]{room.getRoomNumber()}, locale);
        String notifMsg = messageSource.getMessage("notification.minibar.report.message", new Object[]{room.getRoomNumber(), resolvedNoteText, total}, locale);
        notificationService.notifyReceptionistsAndManagers(notifTitle, notifMsg, "/dashboard/check-out");
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoCleanRooms() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        List<HouseKeepingTask> activeTasks = taskRepository.findByTaskStatusInAndCreatedAtBefore(
                List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS),
                oneHourAgo
        );
        
        for (HouseKeepingTask task : activeTasks) {
            Room room = task.getRoom();
            
            // If the room is under MAINTENANCE, we do not transition it to AVAILABLE
            if (room.getRoomStatus() == RoomStatus.MAINTENANCE) {
                log.info("[AUTO-CLEAN] Room {} is under MAINTENANCE. Skipping auto-completion.", room.getRoomNumber());
                continue;
            }
            
            log.info("[AUTO-CLEAN] Auto-completing housekeeping task #{} for Room {} (created at {})",
                    task.getId(), room.getRoomNumber(), task.getCreatedAt());
            
            task.setTaskStatus(TaskStatus.COMPLETED);
            task.setCompletedAt(LocalDateTime.now());
            taskRepository.save(task);
            
            syncHousekeeperWorkStatus(task.getAssignedTo(), TaskStatus.COMPLETED);
            
            changeRoomStatus(room, RoomStatus.AVAILABLE, null, task, 
                    "Auto-completed cleaning after 1 hour", ProcessTrigger.TASK_COMPLETION);
        }
    }
}
