package com.hms.dto.equipment.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentImageResponse {

    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
}