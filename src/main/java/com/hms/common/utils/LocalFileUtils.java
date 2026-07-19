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

    public String uploadFile(MultipartFile file) {
        return uploadFile(file, null);
    }

    public String uploadFile(MultipartFile file, String subDirectory) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            String normalizedSubDirectory = "";

            if (subDirectory != null && !subDirectory.isBlank()) {
                normalizedSubDirectory = subDirectory
                        .replace("\\", "/")
                        .replaceAll("^/+", "")
                        .replaceAll("/+$", "");
                uploadPath = uploadPath.resolve(normalizedSubDirectory).normalize();
            }

            Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID() + extension;
            Path targetLocation = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String urlPath = normalizedSubDirectory.isEmpty()
                    ? uniqueFilename
                    : normalizedSubDirectory + "/" + uniqueFilename;
            return baseUrl + "/uploads/" + urlPath;
        } catch (IOException e) {
            throw new RuntimeException("Cannot save image file: " + e.getMessage());
        }
    }
}
