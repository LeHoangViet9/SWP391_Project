package com.hms.entity.hotel;

import com.hms.common.enums.RoomState;
import com.hms.common.enums.RoomStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "room")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, unique = true, length = 50)
    private String roomNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_status", nullable = false)
    private RoomStatus roomStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_state", nullable = false)
    @Builder.Default
    private RoomState roomState = RoomState.AVAILABLE;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;

    @Column(name = "description")
    private String description;
}


