package com.hms.entity.hotel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_img")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết nhiều ảnh về một phòng (N - 1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "image_url", nullable = false, length = 1000)
    private String imageUrl; // Đường dẫn link ảnh (Cloudinary, S3 hoặc link web công khai)

    @Column(name = "description")
    private String description; // Mô tả góc chụp (Ví dụ: "Ảnh phòng tắm", "Ban công hướng biển")

    @Column(name = "uploaded_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime uploadedAt;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;
}
