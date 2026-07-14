package com.hms.service.housekeeping;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.enums.TaskStatus;
import com.hms.dto.housekeeping.request.HouseKeepingTaskRequest;
import com.hms.dto.housekeeping.request.HouseKeepingTaskUpdateRequest;
import com.hms.dto.housekeeping.request.MinibarReportRequest;
import com.hms.dto.housekeeping.response.HouseKeepingTaskResponse;
import com.hms.dto.housekeeping.response.RoomStateHistoryResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.time.LocalDate;

public interface IHouseKeepingTaskService {

    // CRUD Operations
    HouseKeepingTaskResponse getTaskById(Long id);

    HouseKeepingTaskResponse createTask(HouseKeepingTaskRequest request);

    HouseKeepingTaskResponse updateTask(Long id, HouseKeepingTaskUpdateRequest request);

    void deleteTask(Long id);

    // Tìm kiếm tổng hợp
    Page<HouseKeepingTaskResponse> searchTasks(TaskStatus status, Long assignedToId, Long assignedById, Long roomId, LocalDate fromDate, LocalDate toDate, Integer page, Integer size, SortField sortBy,
                                               SortDirection direction);

    // Additional queries
    List<HouseKeepingTaskResponse> getPendingTasksByRoom(Long roomId);

    List<HouseKeepingTaskResponse> getUncompletedTasksByUser(Long userId);

    // FIX: Thêm hàm lấy lịch sử đổi trạng thái phòng cho housekeeping audit.
    Page<RoomStateHistoryResponse> getRoomStateHistory(Long roomId,Integer page, Integer size,SortField sortBy,SortDirection sortDirection);


    void reportRoomIssue(Long roomId, com.hms.dto.housekeeping.request.ReportRoomIssueRequest request);

    void reportMinibar(Long id, MinibarReportRequest request);
    /**
     * Tự động tạo task dọn phòng khi checkout.
     * Gán cho housekeeper có ít task nhất (round-robin by workload).
     * Gửi email thông báo cho housekeeper được gán.
     *
     * @param roomId ID phòng cần dọn
     * @param triggeredByUserId ID user thực hiện checkout (có thể null)
     */
    void autoCreateCleaningTaskOnCheckout(Long roomId, Long triggeredByUserId);
}
