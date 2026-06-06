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

    // Thiết lập mối quan hệ Many-to-One với bảng Equipment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "repair_reason", nullable = false)
    private String repairReason; // Lý do hỏng/sửa chữa

    @Column(name = "description")
    private String description; // Chi tiết tình trạng sửa chữa

    @Column(name = "cost", precision = 12, scale = 2)
    private BigDecimal cost; // Chi phí sửa chữa (Dùng BigDecimal cho tiền tệ)

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MaintenanceStatus status;// Trạng thái: Đang chờ, Đang sửa, Đã xong...

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceSeverity severity;

    @Column(name = "start_date")
    private LocalDateTime startDate; // Ngày bắt đầu sửa

    @Column(name = "end_date")
    private LocalDateTime endDate; // Ngày sửa xong hoàn thành

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}