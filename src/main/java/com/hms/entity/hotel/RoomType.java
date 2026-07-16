package com.hms.entity.hotel;

import java.math.BigDecimal;

import com.hms.common.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

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
    @Column(name = "description", length = 255)
    private String description;
    @Column(name ="base_price", nullable = false)
    private Integer basePrice;
    @Column(name ="max_guests", nullable = false)
    private Integer maxGuests;
    @Enumerated(EnumType.STRING)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Builder.Default
    @OneToMany(mappedBy = "roomType", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RoomTypeImage> roomTypeImages = new ArrayList<>();
}
