package com.hms.service.housekeeping.impl;

import com.hms.common.enums.RoomState;
import com.hms.common.enums.TaskStatus;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.entity.auth.User;
import com.hms.entity.hotel.Room;
import com.hms.entity.housekeeping.HouseKeepingTask;
import com.hms.entity.housekeeping.RoomStateHistory;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class HouseKeepingTaskServiceImpl implements IHouseKeepingTaskService {

    private final HouseKeepingTaskRepository taskRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomStateHistoryRepository roomStateHistoryRepository;
    private final HouseKeepingTaskMapper taskMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    public Page<HouseKeepingTaskResponse> searchTasks(TaskStatus status, Long assignedToId, Long assignedById, Long roomId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.searchTasks(status, assignedToId, assignedById, roomId, pageable)
                .map(taskMapper::toResponse);
    }

    @Override
    public HouseKeepingTaskResponse getTaskById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        HouseKeepingTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.task.notfound", null, locale)));
        return taskMapper.toResponse(task);
    }

    @Override
    @Transactional
    public HouseKeepingTaskResponse createTask(HouseKeepingTaskRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        // Validate Room exists
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.room.notfound", null, locale)));

        // Validate Assigned To User exists
        User assignedTo = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.notfound", null, locale)));

        // Validate Assigned By User exists
        User assignedBy = userRepository.findById(request.getAssignedById())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.notfound", null, locale)));

        // Tạo task với status PENDING
        HouseKeepingTask task = HouseKeepingTask.builder()
                .room(room)
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .taskStatus(TaskStatus.PENDING)
                .notes(request.getNotes())
                .build();

        HouseKeepingTask saved = taskRepository.save(task);

        // Đổi room state sang CLEANING khi tạo task
        changeRoomState(room, RoomState.CLEANING, assignedBy, saved, "Tạo task dọn phòng");

        return taskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public HouseKeepingTaskResponse updateTask(Long id, HouseKeepingTaskUpdateRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        HouseKeepingTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.task.notfound", null, locale)));

        // 1. Cập nhật notes (nếu có)
        if (request.getNotes() != null) {
            task.setNotes(request.getNotes());
        }

        // 2. Nếu taskStatus == null → chỉ lưu notes, KHÔNG đổi room state
        if (request.getTaskStatus() == null) {
            HouseKeepingTask updated = taskRepository.save(task);
            return taskMapper.toResponse(updated);
        }

        // 3. Có thay đổi status → xử lý chuyển trạng thái
        TaskStatus newStatus = request.getTaskStatus();
        task.setTaskStatus(newStatus);

        // Cập nhật timestamps
        switch (newStatus) {
            case IN_PROGRESS:
                // Dùng startedAt từ request, nếu không có thì auto now()
                if (request.getStartedAt() != null) {
                    task.setStartedAt(request.getStartedAt());
                } else if (task.getStartedAt() == null) {
                    task.setStartedAt(LocalDateTime.now());
                }
                break;
            case COMPLETED:
                task.setCompletedAt(LocalDateTime.now());
                break;
            default:
                break;
        }

        HouseKeepingTask updated = taskRepository.save(task);

        // Đổi Room state theo task status
        Room room = task.getRoom();
        switch (newStatus) {
            case IN_PROGRESS:
                changeRoomState(room, RoomState.CLEANING, task.getAssignedTo(), task, "Task bắt đầu dọn phòng");
                break;
            case COMPLETED:
                changeRoomState(room, RoomState.AVAILABLE, task.getAssignedTo(), task, "Task hoàn thành - phòng sạch");
                break;
            case CANCELLED:
                changeRoomState(room, RoomState.DIRTY, task.getAssignedTo(), task, "Task bị hủy");
                break;
            case SKIPPED:
                changeRoomState(room, RoomState.DIRTY, task.getAssignedTo(), task, "Task bị bỏ qua");
                break;
            default:
                break;
        }

        return taskMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        HouseKeepingTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.task.notfound", null, locale)));
        taskRepository.delete(task);
    }

    @Override
    public List<HouseKeepingTaskResponse> getPendingTasksByRoom(Long roomId) {
        List<HouseKeepingTask> tasks = taskRepository.findByRoomIdAndTaskStatus(roomId, TaskStatus.PENDING);
        return taskMapper.toResponseList(tasks);
    }

    @Override
    public List<HouseKeepingTaskResponse> getUncompletedTasksByUser(Long userId) {
        List<TaskStatus> uncompletedStatuses = List.of(
                TaskStatus.PENDING,
                TaskStatus.IN_PROGRESS
        );
        List<HouseKeepingTask> tasks = taskRepository.findByAssignedToIdAndTaskStatusIn(userId, uncompletedStatuses);
        return taskMapper.toResponseList(tasks);
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Thay đổi room state và ghi log lịch sử.
     * Chỉ thay đổi nếu state mới khác state hiện tại.
     */
    private void changeRoomState(Room room, RoomState newState, User changedBy, HouseKeepingTask task, String reason) {
        RoomState previousState = room.getRoomState();

        // Không ghi log nếu state không thay đổi
        if (previousState == newState) {
            return;
        }

        // Cập nhật room state
        room.setRoomState(newState);
        roomRepository.save(room);

        // Ghi log lịch sử
        RoomStateHistory history = RoomStateHistory.builder()
                .room(room)
                .previousState(previousState)
                .newState(newState)
                .changedBy(changedBy)
                .task(task)
                .changedAt(LocalDateTime.now())
                .reason(reason)
                .build();

        roomStateHistoryRepository.save(history);
    }
}



