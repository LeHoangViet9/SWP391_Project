package com.hms.repository.housekeeping;

import com.hms.common.enums.TaskStatus;
import com.hms.entity.housekeeping.HouseKeepingTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HouseKeepingTaskRepository extends JpaRepository<HouseKeepingTask, Long> {

    // Tìm kiếm tổng hợp với các filter optional
    @Query("SELECT t FROM HouseKeepingTask t WHERE " +
            "(:status IS NULL OR t.taskStatus = :status) AND " +
            "(:assignedToId IS NULL OR t.assignedTo.id = :assignedToId) AND " +
            "(:assignedById IS NULL OR t.assignedBy.id = :assignedById) AND " +
            "(:roomId IS NULL OR t.room.id = :roomId)")
    Page<HouseKeepingTask> searchTasks(
            @Param("status") TaskStatus status,
            @Param("assignedToId") Long assignedToId,
            @Param("assignedById") Long assignedById,
            @Param("roomId") Long roomId,
            Pageable pageable);

    // Kiểm tra tasks đang pending cho phòng
    List<HouseKeepingTask> findByRoomIdAndTaskStatus(Long roomId, TaskStatus status);

    // Kiểm tra xem user có tasks chưa completed không
    List<HouseKeepingTask> findByAssignedToIdAndTaskStatusIn(Long userId, List<TaskStatus> statuses);
}

