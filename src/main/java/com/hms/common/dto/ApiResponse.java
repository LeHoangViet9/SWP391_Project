package com.hms.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    /**
     * Serialize thành integer (200, 201, 400, ...) thay vì object HttpStatus phức tạp.
     * Ví dụ: HttpStatus.OK → 200
     */
    private int statusCode;

    /**
     * Field này chỉ dùng nội bộ (để build ResponseEntity), không serialize ra JSON.
     */
    @JsonIgnore
    private HttpStatus status;


    /**
     * Constructor tương thích ngược với code cũ dùng (boolean, String, T, HttpStatus).
     */
    public ApiResponse(boolean success, String message, T data, HttpStatus status) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.status = status;
        this.statusCode = status != null ? status.value() : 0;
    }

    // ──────────────────────────────────────────────────────────────────
    // Static factory helpers (giữ nguyên API cũ)
    // ──────────────────────────────────────────────────────────────────

    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}
