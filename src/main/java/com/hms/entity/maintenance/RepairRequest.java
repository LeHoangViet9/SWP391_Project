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

    // Nếu yêu cầu có thể liên quan đến phòng hoặc thiết bị, để nullable = true
    @Column(name = "room_id", nullable = true)
    private Long roomId;

    @Column(name = "equipment_id", nullable = true)
    private Long equipmentId;

    // người được phân công sửa (user id), có thể null nếu chưa phân công
    @Column(name = "assigned_to", nullable = true)
    private Long assignedTo;

    @Column(name = "issue_title", nullable = false, length = 255)
    private String issueTitle;

    @Column(name = "issue_description", nullable = true, columnDefinition = "text")
    private String issueDescription;

    @Column(name = "diagnosis", nullable = true, columnDefinition = "text")
    private String diagnosis;

    @Column(name = "repair_result", nullable = true, columnDefinition = "text")
    private String repairResult;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private MaintenanceSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    // gán default trong Java để entity mới có status = PENDING
    private MaintenanceStatus status = MaintenanceStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = true)
    private LocalDateTime updatedAt;
}