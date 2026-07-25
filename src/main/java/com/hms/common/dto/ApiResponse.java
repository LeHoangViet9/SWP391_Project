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
     * Serialize to integer (200, 201, 400, ...) instead of complex HttpStatus object.
     * Example: HttpStatus.OK → 200
     */
    private int statusCode;

    /**
     * Internal field (for building ResponseEntity), not serialized to JSON.
     */
    @JsonIgnore
    private HttpStatus status;


    /**
     * Backwards-compatible constructor with legacy code using (boolean, String, T, HttpStatus).
     */
    public ApiResponse(boolean success, String message, T data, HttpStatus status) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.status = status;
        this.statusCode = status != null ? status.value() : 0;
    }

    // ──────────────────────────────────────────────────────────────────
    // Static factory helpers (preserve existing API)
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
