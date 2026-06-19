package com.hms.entity.housekeeping;

import com.hms.common.enums.TaskStatus;
import com.hms.entity.auth.User;
import com.hms.entity.hotel.Room;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "housekeeping_task")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HouseKeepingTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_to", nullable = false)
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_status", nullable = false, length = 20)
    @Builder.Default
    private TaskStatus taskStatus = TaskStatus.PENDING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // FIX: Bổ sung createdAt vì response đã có field này nhưng entity chưa lưu.
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // FIX: Bổ sung updatedAt để biết lần cuối task được cập nhật.
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // FIX: Tự set mốc thời gian tạo/cập nhật, tránh bị null khi save.
    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    // FIX: Tự cập nhật updatedAt mỗi lần update task.
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}