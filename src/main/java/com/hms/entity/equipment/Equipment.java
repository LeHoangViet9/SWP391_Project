package com.hms.entity.equipment;
import com.hms.common.enums.EquipmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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

    @Column(name="equipment_name", nullable = false)
    private String equipmentName;

    @Column(name="equipment_code", nullable = false, unique = true)
    private String equipmentCode;

    @Column(nullable = false)
    private String location;

    private String description;

    @Column(name="image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private EquipmentStatus status;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
}
