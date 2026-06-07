package com.hms.entity.maintenance;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.entity.auth.User;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.hotel.Room;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id")
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "repair_reason", nullable = false)
    private String repairReason;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "diagnosis", columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "repair_result", columnDefinition = "TEXT")
    private String repairResult;

    @Column(name = "cost", precision = 12, scale = 2)
    private BigDecimal cost;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MaintenanceStatus status = MaintenanceStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private MaintenanceSeverity severity;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}