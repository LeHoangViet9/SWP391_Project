package com.hms.service.housekeeping;

import com.hms.common.enums.TaskStatus;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IHouseKeepingTaskService {

    // CRUD Operations
    Page<HouseKeepingTaskResponse> getAllTasks(Integer page, Integer size);

    HouseKeepingTaskResponse getTaskById(Long id);

    HouseKeepingTaskResponse createTask(HouseKeepingTaskRequest request);

    HouseKeepingTaskResponse updateTask(Long id, HouseKeepingTaskUpdateRequest request);

    void deleteTask(Long id);

    // Filter Operations
    Page<HouseKeepingTaskResponse> getTasksByStatus(TaskStatus status, Integer page, Integer size);

    Page<HouseKeepingTaskResponse> getTasksByAssignedTo(Long userId, Integer page, Integer size);

    Page<HouseKeepingTaskResponse> getTasksByAssignedBy(Long userId, Integer page, Integer size);

    Page<HouseKeepingTaskResponse> getTasksByRoom(Long roomId, Integer page, Integer size);

    Page<HouseKeepingTaskResponse> getTasksByStatusAndAssignedTo(TaskStatus status, Long userId, Integer page, Integer size);

    Page<HouseKeepingTaskResponse> getTasksByStatusAndRoom(TaskStatus status, Long roomId, Integer page, Integer size);

    // Status Management
    void updateTaskStatus(Long taskId, TaskStatus status);

    void startTask(Long taskId);

    void completeTask(Long taskId);

    void cancelTask(Long taskId);

    void skipTask(Long taskId);

    // Additional queries
    List<HouseKeepingTaskResponse> getPendingTasksByRoom(Long roomId);

    List<HouseKeepingTaskResponse> getUncompletedTasksByUser(Long userId);
}

