package com.hms.service.housekeeping.impl;

import com.hms.common.enums.*;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.request.ReportRoomIssueRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.dto.housekeeping.response.RoomStateHistoryResponse;
import com.hms.entity.auth.User;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomStateHistory;
import com.hms.entity.housekeeping.HouseKeepingTask;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.housekeeping.HouseKeepingTaskRepository;
import com.hms.repository.housekeeping.RoomStateHistoryRepository;
import com.hms.service.housekeeping.IHouseKeepingTaskService;
import com.hms.service.housekeeping.mapper.HouseKeepingTaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Override
    @Transactional(readOnly = true)
    public Page<HouseKeepingTaskResponse> searchTasks(TaskStatus status, Long assignedToId, Long assignedById, Long roomId, Integer page, Integer size, SortField sortField, SortDirection direction) {
        String sortBy = sortField != null
                ? sortField.getField()
                : "createdAt";

        Pageable pageable = pageableUtils.createPageable(page, size, sortBy, direction);
        return taskRepository.searchTasks(status, Collections.emptyList(), false, assignedToId, assignedById, roomId, pageable)
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

        User assignedBy = userRepository.findById(request.getAssignedById())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.notfound", null, locale)));

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

        // Đổi trạng thái phòng thành MAINTENANCE và ghi nhận lịch sử với reason
        changeRoomStatus(room, RoomStatus.MAINTENANCE, reportedBy, null, request.getReason(),ProcessTrigger.TASK_MAINTENANCE);
    }

}