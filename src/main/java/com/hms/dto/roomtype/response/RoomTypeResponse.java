package com.hms.dto.roomtype.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomTypeResponse {
    private Long id;
    private String typeName;
    private String description;
    private Integer basePrice;
    private Integer maxGuests;
    private String status;
    private Long totalRooms;
    private Double averageRating;
    private Long reviewCount;
    private String imageUrl;
    private List<String> imageUrls;
}
