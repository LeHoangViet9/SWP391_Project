package com.hms.controller.notification;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.notification.response.NotificationResponse;
import com.hms.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
                .success(true)
                .message("Notifications retrieved successfully")
                .data(notificationService.getMyNotifications(email, limit))
                .status(HttpStatus.OK)
                .build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countUnread(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
                .success(true)
                .message("Unread notification count retrieved successfully")
                .data(Map.of("count", notificationService.countUnread(email)))
                .status(HttpStatus.OK)
                .build());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<NotificationResponse>builder()
                .success(true)
                .message("Notification marked as read")
                .data(notificationService.markAsRead(email, id))
                .status(HttpStatus.OK)
                .build());
    }
}
