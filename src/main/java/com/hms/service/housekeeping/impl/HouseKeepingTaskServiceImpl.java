package com.hms.service.housekeeping.impl;

import com.hms.common.enums.TaskStatus;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.entity.auth.User;
import com.hms.entity.hotel.Room;
import com.hms.entity.housekeeping.HouseKeepingTask;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.housekeeping.HouseKeepingTaskRepository;
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
    private final HouseKeepingTaskMapper taskMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    public Page<HouseKeepingTaskResponse> getAllTasks(Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.findAll(pageable).map(taskMapper::toResponse);
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

        HouseKeepingTask task = HouseKeepingTask.builder()
                .room(room)
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .taskStatus(TaskStatus.PENDING)
                .notes(request.getNotes())
                .build();

        HouseKeepingTask saved = taskRepository.save(task);
        return taskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public HouseKeepingTaskResponse updateTask(Long id, HouseKeepingTaskUpdateRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        HouseKeepingTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.task.notfound", null, locale)));

        // Update Room if provided
        if (request.getRoomId() != null) {
            Room room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.room.notfound", null, locale)));
            task.setRoom(room);
        }

        // Update Assigned To User if provided
        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.user.notfound", null, locale)));
            task.setAssignedTo(assignedTo);
        }

        // Update Status if provided
        if (request.getTaskStatus() != null) {
            task.setTaskStatus(request.getTaskStatus());
        }

        // Update Notes if provided
        if (request.getNotes() != null) {
            task.setNotes(request.getNotes());
        }

        HouseKeepingTask updated = taskRepository.save(task);
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
    public Page<HouseKeepingTaskResponse> getTasksByStatus(TaskStatus status, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.findByTaskStatus(status, pageable).map(taskMapper::toResponse);
    }

    @Override
    public Page<HouseKeepingTaskResponse> getTasksByAssignedTo(Long userId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.findByAssignedToId(userId, pageable).map(taskMapper::toResponse);
    }

    @Override
    public Page<HouseKeepingTaskResponse> getTasksByAssignedBy(Long userId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.findByAssignedById(userId, pageable).map(taskMapper::toResponse);
    }

    @Override
    public Page<HouseKeepingTaskResponse> getTasksByRoom(Long roomId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.findByRoomId(roomId, pageable).map(taskMapper::toResponse);
    }

    @Override
    public Page<HouseKeepingTaskResponse> getTasksByStatusAndAssignedTo(TaskStatus status, Long userId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.findByTaskStatusAndAssignedToId(status, userId, pageable)
                .map(taskMapper::toResponse);
    }

    @Override
    public Page<HouseKeepingTaskResponse> getTasksByStatusAndRoom(TaskStatus status, Long roomId, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "id", null);
        return taskRepository.findByTaskStatusAndRoomId(status, roomId, pageable)
                .map(taskMapper::toResponse);
    }

    @Override
    @Transactional
    public void updateTaskStatus(Long taskId, TaskStatus status) {
        Locale locale = LocaleContextHolder.getLocale();
        HouseKeepingTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.task.notfound", null, locale)));

        task.setTaskStatus(status);

        // Auto-set timestamps based on status
        if (status == TaskStatus.IN_PROGRESS && task.getStartedAt() == null) {
            task.setStartedAt(LocalDateTime.now());
        } else if (status == TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        }

        taskRepository.save(task);
    }

    @Override
    @Transactional
    public void startTask(Long taskId) {
        updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
    }

    @Override
    @Transactional
    public void completeTask(Long taskId) {
        updateTaskStatus(taskId, TaskStatus.COMPLETED);
    }

    @Override
    @Transactional
    public void cancelTask(Long taskId) {
        updateTaskStatus(taskId, TaskStatus.CANCELLED);
    }

    @Override
    @Transactional
    public void skipTask(Long taskId) {
        updateTaskStatus(taskId, TaskStatus.SKIPPED);
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
}

