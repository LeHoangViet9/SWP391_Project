package com.hms.entity.equipment;

import com.hms.common.enums.EquipmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "equipments")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //  tên thiết bị, ví dụ: TV Samsung, Điều hòa Daikin
    @Column(name = "equipment_name", nullable = false)
    private String equipmentName;

    //  mã loại thiết bị, ví dụ: TV, AC, LAMP
    @Column(name = "equipment_code", nullable = false, unique = true)
    private String equipmentCode;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EquipmentStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    //  1 thiết bị có nhiều ảnh
    @Builder.Default
    @OneToMany(mappedBy = "equipment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EquipmentImage> images = new ArrayList<>();

    //  1 thiết bị có nhiều lần kiểm tra
    @Builder.Default
    @OneToMany(mappedBy = "equipment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EquipmentCheck> checks = new ArrayList<>();

    // SỬA MỚI:
    // Không dùng equipments.room_id nữa.
    // Gán thiết bị vào phòng thông qua bảng room_equipments.
    @Builder.Default
    @OneToMany(mappedBy = "equipment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomEquipment> roomEquipments = new ArrayList<>();
}