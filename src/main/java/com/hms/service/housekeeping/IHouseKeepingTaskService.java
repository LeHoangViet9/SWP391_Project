package com.hms.service.housekeeping;

import com.hms.common.enums.TaskStatus;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IHouseKeepingTaskService {

    // CRUD Operations
    HouseKeepingTaskResponse getTaskById(Long id);

    HouseKeepingTaskResponse createTask(HouseKeepingTaskRequest request);

    HouseKeepingTaskResponse updateTask(Long id, HouseKeepingTaskUpdateRequest request);

    void deleteTask(Long id);

    // Tìm kiếm tổng hợp
    Page<HouseKeepingTaskResponse> searchTasks(TaskStatus status, Long assignedToId, Long assignedById, Long roomId, Integer page, Integer size);

    // Additional queries
    List<HouseKeepingTaskResponse> getPendingTasksByRoom(Long roomId);

    List<HouseKeepingTaskResponse> getUncompletedTasksByUser(Long userId);
}



