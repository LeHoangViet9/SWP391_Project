package com.hms.repository.housekeeping;

import com.hms.common.enums.TaskStatus;
import com.hms.entity.housekeeping.HouseKeepingTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseKeepingTaskRepository extends JpaRepository<HouseKeepingTask, Long> {

    // Lấy tasks theo trạng thái
    Page<HouseKeepingTask> findByTaskStatus(TaskStatus status, Pageable pageable);

    // Lấy tasks gán cho user
    Page<HouseKeepingTask> findByAssignedToId(Long userId, Pageable pageable);

    // Lấy tasks gán bởi user
    Page<HouseKeepingTask> findByAssignedById(Long userId, Pageable pageable);

    // Lấy tasks cho phòng
    Page<HouseKeepingTask> findByRoomId(Long roomId, Pageable pageable);

    // Lấy tasks theo trạng thái và người được gán
    Page<HouseKeepingTask> findByTaskStatusAndAssignedToId(TaskStatus status, Long userId, Pageable pageable);

    // Lấy tasks theo trạng thái và phòng
    Page<HouseKeepingTask> findByTaskStatusAndRoomId(TaskStatus status, Long roomId, Pageable pageable);

    // Kiểm tra tasks đang pending cho phòng
    List<HouseKeepingTask> findByRoomIdAndTaskStatus(Long roomId, TaskStatus status);

    // Lấy tasks chưa hoàn thành cho phòng
    List<HouseKeepingTask> findByRoomIdAndTaskStatusIn(Long roomId, List<TaskStatus> statuses);

    // Kiểm tra xem user có tasks chưa completed không
    List<HouseKeepingTask> findByAssignedToIdAndTaskStatusIn(Long userId, List<TaskStatus> statuses);
}

