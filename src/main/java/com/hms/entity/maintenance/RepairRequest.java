package com.hms.entity.maintenance;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepairRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    // Nếu yêu cầu có thể liên quan đến phòng hoặc thiết bị, để null nếu không có
    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "equipment_id")
    private Long equipmentId;

    // Người báo lỗi: housekeeper/receptionist/staff
    @Column(name = "reported_by")
    private Long reportedBy;

    // người được phân công sửa (user id), có thể null nếu chưa phân công
    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "issue_title", nullable = false, length = 255)
    private String issueTitle;

    @Column(name = "issue_description", columnDefinition = "TEXT")
    private String issueDescription;

    @Column(name = "diagnosis", columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "repair_result", columnDefinition = "TEXT")
    private String repairResult;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private MaintenanceSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MaintenanceStatus status = MaintenanceStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "estimated_completion_time")
    private LocalDateTime estimatedCompletionTime;
}