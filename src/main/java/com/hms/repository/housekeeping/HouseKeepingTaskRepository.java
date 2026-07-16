package com.hms.repository.housekeeping;

import com.hms.common.enums.TaskStatus;
import com.hms.entity.housekeeping.HouseKeepingTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HouseKeepingTaskRepository extends JpaRepository<HouseKeepingTask, Long> {

        // FIX: Gộp các hàm filter riêng lẻ vào 1 query chung.
        // Dùng status cho lọc 1 trạng thái, statuses cho lọc nhiều trạng thái như
        // PENDING + IN_PROGRESS.
        @Query("SELECT t FROM HouseKeepingTask t WHERE " +
                        "(:status IS NULL OR t.taskStatus = :status) AND " +
                        "(:useStatuses = false OR t.taskStatus IN :statuses) AND " +
                        "(:assignedToId IS NULL OR t.assignedTo.id = :assignedToId) AND " +
                        "(:assignedById IS NULL OR t.assignedBy.id = :assignedById) AND " +
                        "(:roomId IS NULL OR t.room.id = :roomId) AND " +
                        "t.createdAt >= :fromDate AND " +
                        "t.createdAt < :toDate")
        Page<HouseKeepingTask> searchTasks(
                        @Param("status") TaskStatus status,
                        @Param("statuses") List<TaskStatus> statuses,
                        @Param("useStatuses") boolean useStatuses,
                        @Param("assignedToId") Long assignedToId,
                        @Param("assignedById") Long assignedById,
                        @Param("roomId") Long roomId,
                        @Param("fromDate") java.time.LocalDateTime fromDate,
                        @Param("toDate") java.time.LocalDateTime toDate,
                        Pageable pageable);

        List<HouseKeepingTask> findByRoom_IdAndTaskStatus(Long roomId, TaskStatus status);

        List<HouseKeepingTask> findByAssignedTo_IdAndTaskStatusIn(Long userId, List<TaskStatus> statuses);

        boolean existsByRoom_IdAndTaskStatusIn(Long roomId, List<TaskStatus> statuses);

        @Query("SELECT t FROM HouseKeepingTask t " +
                        "JOIN FETCH t.room " +
                        "JOIN FETCH t.assignedTo " +
                        "JOIN FETCH t.assignedBy " +
                        "WHERE t.id = :id")
        Optional<HouseKeepingTask> findByIdWithDetails(@Param("id") Long id);

        long countByAssignedTo_IdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

        boolean existsByAssignedTo_IdAndTaskStatus(Long userId, TaskStatus status);

        List<HouseKeepingTask> findByTaskStatusInAndCreatedAtBefore(List<TaskStatus> statuses, LocalDateTime dateTime);

        // Tìm các task đang chờ kiểm phòng (checkout inspection) chưa hoàn thành.
        // Dùng cho scheduled job theo dõi timeout 5 phút và 10 phút.
        @Query("SELECT t FROM HouseKeepingTask t " +
                "JOIN FETCH t.room " +
                "JOIN FETCH t.assignedTo " +
                "JOIN FETCH t.assignedBy " +
                "WHERE t.checkoutInspectionRequestedAt IS NOT NULL " +
                "AND t.taskStatus IN :statuses")
        List<HouseKeepingTask> findPendingCheckoutInspectionTasks(@Param("statuses") List<TaskStatus> statuses);
}
