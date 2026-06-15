package com.hms.repository.housekeeping;

import com.hms.common.enums.TaskStatus;
import com.hms.entity.hotel.RoomStateHistory;
import com.hms.entity.housekeeping.HouseKeepingTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseKeepingTaskRepository extends JpaRepository<HouseKeepingTask, Long> {

    // FIX: Gộp các hàm filter riêng lẻ vào 1 query chung.
    // Dùng status cho lọc 1 trạng thái, statuses cho lọc nhiều trạng thái như PENDING + IN_PROGRESS.
    @Query("SELECT t FROM HouseKeepingTask t WHERE " +
            "(:status IS NULL OR t.taskStatus = :status) AND " +
            "(:useStatuses = false OR t.taskStatus IN :statuses) AND " +
            "(:assignedToId IS NULL OR t.assignedTo.id = :assignedToId) AND " +
            "(:assignedById IS NULL OR t.assignedBy.id = :assignedById) AND " +
            "(:roomId IS NULL OR t.room.id = :roomId)")
    Page<HouseKeepingTask> searchTasks(
            @Param("status") TaskStatus status,
            @Param("statuses") List<TaskStatus> statuses,
            @Param("useStatuses") boolean useStatuses,
            @Param("assignedToId") Long assignedToId,
            @Param("assignedById") Long assignedById,
            @Param("roomId") Long roomId,
            Pageable pageable);
    List<HouseKeepingTask> findByRoom_IdAndTaskStatus(Long roomId, TaskStatus status);

    List<HouseKeepingTask> findByAssignedTo_IdAndTaskStatusIn(Long userId, List<TaskStatus> statuses);

    @Query("SELECT t FROM HouseKeepingTask t " +
            "JOIN FETCH t.room " +
            "JOIN FETCH t.assignedTo " +
            "JOIN FETCH t.assignedBy " +
            "WHERE t.id = :id")
    Optional<HouseKeepingTask> findByIdWithDetails(@Param("id") Long id);
}
