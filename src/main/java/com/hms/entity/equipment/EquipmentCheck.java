package com.hms.entity.equipment;

import com.hms.entity.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.hms.common.enums.EquipmentConditionStatus;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_checks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", nullable = false)
    private EquipmentConditionStatus conditionStatus;

    @Column(name = "check_note", columnDefinition = "TEXT")
    private String checkNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by_id")
    private User checkedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @CreationTimestamp
    @Column(name = "checked_at", nullable = false, updatable = false)
    private LocalDateTime checkedAt;
}