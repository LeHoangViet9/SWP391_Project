package com.hms.dto.roomImg.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RoomImgResponse {
    private Long id;
    private String imageUrl;
    private String description;
    private LocalDateTime uploadedAt;
    private List<RoomImgResponse> roomImages;
}
