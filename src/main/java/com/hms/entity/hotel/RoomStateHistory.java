package com.hms.entity.hotel;

import com.hms.common.enums.ProcessTrigger;
import com.hms.common.enums.RoomStatus;
import com.hms.entity.auth.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_state_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomStateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_state", nullable = false)
    private RoomStatus previousState;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false)
    private RoomStatus currentState;

    @Enumerated(EnumType.STRING)
    @Column(name = "triggered_by_process", nullable = false)
    private ProcessTrigger triggeredByProcess;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by_user")
    private User triggeredByUser;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    protected void onCreate() {
        this.changedAt = LocalDateTime.now();
    }
}
