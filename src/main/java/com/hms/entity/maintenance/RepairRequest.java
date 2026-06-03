package com.hms.entity.maintenance;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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
    private Long id;

    private Long roomId;

    private Long equipmentId;

    private Long assignedTo;

    @Column(nullable = false)
    private String issueTitle;

    private String issueDescription;

    private String diagnosis;

    private String repairResult;

    @Enumerated(EnumType.STRING)
    private MaintenanceSeverity severity;

    @Enumerated(EnumType.STRING)
    private MaintenanceStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}