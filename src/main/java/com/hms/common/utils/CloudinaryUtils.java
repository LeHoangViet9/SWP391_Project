package com.hms.common.utils;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryUtils {
    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) {
        try {
            // Đẩy file lên Cloudinary và nhận kết quả trả về
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());

            // Lấy ra đường link URL của ảnh
            return uploadResult.get("url").toString();
        } catch (IOException e) {
            throw new RuntimeException("error.upload.image: " + e.getMessage());
        }
    }
}
