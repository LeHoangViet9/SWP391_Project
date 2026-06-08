package com.hms.service.housekeeping.impl;

import com.hms.common.enums.RoomState;
import com.hms.common.enums.TaskStatus;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.dto.housekeeping.response.RoomStateHistoryResponse;
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
import java.util.Collections;
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
        // FIX: Tất cả lọc task đi qua 1 query chung trong repository.
        return taskRepository.searchTasks(status, Collections.emptyList(), false, assignedToId, assignedById, roomId, pageable)
                .map(taskMapper::toResponse);
    }

    @Override
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

        // FIX: Nếu request có startedAt thì task bắt đầu luôn, ngược lại vẫn là PENDING.
        TaskStatus initialStatus = request.getStartedAt() != null ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING;

        HouseKeepingTask task = HouseKeepingTask.builder()
                .room(room)
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .taskStatus(initialStatus)
                .notes(request.getNotes())
                .startedAt(request.getStartedAt())
                .build();

        HouseKeepingTask saved = taskRepository.save(task);

        // FIX: Theo nghiệp vụ housekeeping, khi tạo task dọn dẹp thì phòng chuyển sang CLEANING.
        changeRoomState(room, RoomState.CLEANING, assignedBy, saved, "Tạo task dọn phòng");

        return taskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public HouseKeepingTaskResponse updateTask(Long id, HouseKeepingTaskUpdateRequest request) {
        HouseKeepingTask task = findTaskById(id);

        // FIX: Notes vẫn được lưu nếu client gửi lên, nhưng notes không làm đổi room state.
        if (request.getNotes() != null) {
            task.setNotes(request.getNotes());
        }

        // FIX: Nếu taskStatus null thì chỉ lưu thông tin phụ như notes, KHÔNG đổi trạng thái phòng.
        if (request.getTaskStatus() == null) {
            return taskMapper.toResponse(taskRepository.save(task));
        }

        TaskStatus oldStatus = task.getTaskStatus();
        TaskStatus newStatus = request.getTaskStatus();

        // FIX: Nếu status không thay đổi thì chỉ save notes/updatedAt, không ghi history, không update timestamp nghiệp vụ.
        if (oldStatus == newStatus) {
            return taskMapper.toResponse(taskRepository.save(task));
        }

        task.setTaskStatus(newStatus);

        // FIX: Cập nhật mốc thời gian theo trạng thái thực sự thay đổi.
        updateBusinessTimestamps(task, request, newStatus);

        HouseKeepingTask updated = taskRepository.save(task);

        // FIX: Chỉ đổi room state khi taskStatus thật sự thay đổi.
        updateRoomStateByTaskStatus(updated, newStatus);

        return taskMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        HouseKeepingTask task = findTaskById(id);
        taskRepository.delete(task);
    }

    @Override
    public List<HouseKeepingTaskResponse> getPendingTasksByRoom(Long roomId) {
        Pageable pageable = pageableUtils.createPageable(1, Integer.MAX_VALUE, "id", null);
        // FIX: Không dùng findByRoomIdAndTaskStatus nữa, dùng query chung.
        return taskMapper.toResponseList(taskRepository
                .searchTasks(TaskStatus.PENDING, Collections.emptyList(), false, null, null, roomId, pageable)
                .getContent());
    }

    @Override
    public List<HouseKeepingTaskResponse> getUncompletedTasksByUser(Long userId) {
        Pageable pageable = pageableUtils.createPageable(1, Integer.MAX_VALUE, "id", null);
        List<TaskStatus> uncompletedStatuses = List.of(TaskStatus.PENDING, TaskStatus.IN_PROGRESS);
        // FIX: Không dùng findByAssignedToIdAndTaskStatusIn nữa, dùng query chung.
        return taskMapper.toResponseList(taskRepository
                .searchTasks(null, uncompletedStatuses, true, userId, null, null, pageable)
                .getContent());
    }


    @Override
    public List<RoomStateHistoryResponse> getRoomStateHistory(Long roomId) {
        // FIX: Cho phép xem lịch sử trạng thái phòng để kiểm tra luồng housekeeping.
        return roomStateHistoryRepository.findByRoomIdOrderByChangedAtDesc(roomId)
                .stream()
                .map(this::toRoomStateHistoryResponse)
                .toList();
    }

    // ==================== PRIVATE HELPERS ====================


    private RoomStateHistoryResponse toRoomStateHistoryResponse(RoomStateHistory history) {
        User changedBy = history.getChangedBy();
        HouseKeepingTask task = history.getTask();
        return RoomStateHistoryResponse.builder()
                .id(history.getId())
                .roomId(history.getRoom().getId())
                .roomNumber(history.getRoom().getRoomNumber())
                .previousState(history.getPreviousState())
                .newState(history.getNewState())
                .changedById(changedBy != null ? changedBy.getId() : null)
                .changedByName(changedBy != null ? changedBy.getFullName() : null)
                .taskId(task != null ? task.getId() : null)
                .changedAt(history.getChangedAt())
                .reason(history.getReason())
                .build();
    }

    private HouseKeepingTask findTaskById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.task.notfound", null, locale)));
    }

    private void updateBusinessTimestamps(HouseKeepingTask task, HouseKeepingTaskUpdateRequest request, TaskStatus newStatus) {
        switch (newStatus) {
            case IN_PROGRESS:
                // FIX: Ưu tiên startedAt từ request, nếu không có thì tự set now khi bắt đầu task.
                task.setStartedAt(request.getStartedAt() != null ? request.getStartedAt() : LocalDateTime.now());
                break;
            case COMPLETED:
                // FIX: Nếu hoàn thành mà chưa có startedAt thì tự set để không thiếu mốc bắt đầu.
                if (task.getStartedAt() == null) {
                    task.setStartedAt(request.getStartedAt() != null ? request.getStartedAt() : LocalDateTime.now());
                }
                task.setCompletedAt(LocalDateTime.now());
                break;
            case CANCELLED:
            case SKIPPED:
                // FIX: Task bị hủy/bỏ qua thì không set completedAt.
                break;
            default:
                break;
        }
    }

    private void updateRoomStateByTaskStatus(HouseKeepingTask task, TaskStatus newStatus) {
        Room room = task.getRoom();
        switch (newStatus) {
            case IN_PROGRESS:
                changeRoomState(room, RoomState.CLEANING, task.getAssignedTo(), task, "Task bắt đầu dọn phòng");
                break;
            case COMPLETED:
                // FIX: Hoàn thành dọn phòng chuyển sang READY thay vì AVAILABLE để đúng luồng housekeeping.
                changeRoomState(room, RoomState.READY, task.getAssignedTo(), task, "Task hoàn thành - phòng đã sạch/chờ sẵn sàng");
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
    }

    /**
     * FIX: Đổi room state và ghi RoomStateHistory.
     * Nếu trạng thái phòng không đổi thì chỉ lưu task, không ghi log history trùng.
     */
    private void changeRoomState(Room room, RoomState newState, User changedBy, HouseKeepingTask task, String reason) {
        RoomState previousState = room.getRoomState();

        if (previousState == newState) {
            return;
        }

        room.setRoomState(newState);
        roomRepository.save(room);

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
