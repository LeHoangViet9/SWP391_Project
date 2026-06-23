package com.hms.dto.roomImg.request;

import lombok.Data;

@Data
public class RoomImgRequest {
    private String imageUrl;    // Đường dẫn ảnh (Cloudinary, S3, v.v.)
    private String description;
}
