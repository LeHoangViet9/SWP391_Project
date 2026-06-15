package com.hms.entity.hotel;

import java.math.BigDecimal;

import com.hms.common.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="room_type")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class RoomType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "type_name",nullable = false, unique = true, length = 100)
    private String typeName;
    @Column(name = "description")
    private String description;
    @Column(name ="base_price", nullable = false)
    private BigDecimal basePrice;
    @Column(name ="max_guests", nullable = false)
    private Integer maxGuests;
    @Enumerated(EnumType.STRING)
    private AccountStatus status = AccountStatus.ACTIVE;
}
