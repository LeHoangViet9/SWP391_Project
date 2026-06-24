package com.hms.common.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalFileUtils {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Lưu file ảnh vào thư mục local và trả về URL có thể truy cập từ frontend.
     */
    public String uploadFile(MultipartFile file) {
        try {
            // Tạo thư mục nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            // Tạo tên file duy nhất để tránh trùng lặp
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Lưu file vào thư mục
            Path targetLocation = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Trả về URL có thể truy cập từ frontend
            return baseUrl + "/uploads/" + uniqueFilename;

        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file ảnh: " + e.getMessage());
        }
    }
}
