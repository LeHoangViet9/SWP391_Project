package com.hms.entity.equipment;

import com.hms.entity.hotel.Room;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "room_equipments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "equipment_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SỬA MỚI:
    // Một phòng có thể được gán nhiều loại thiết bị.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    // SỬA MỚI:
    // Một loại thiết bị có thể xuất hiện ở nhiều phòng.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    // SỬA MỚI:
    // Số lượng thiết bị trong phòng.
    // Ví dụ: phòng 101 có 2 đèn ngủ.
    @Builder.Default
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;
}