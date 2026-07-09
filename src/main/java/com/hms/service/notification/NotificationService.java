package com.hms.service.notification;

import com.hms.dto.notification.response.NotificationResponse;
import com.hms.entity.auth.User;

import java.util.List;

public interface NotificationService {
    void notify(User recipient, String title, String message, String targetUrl);

    List<NotificationResponse> getMyNotifications(String email, int limit);

    long countUnread(String email);

    NotificationResponse markAsRead(String email, Long notificationId);

    void notifyReceptionistsAndManagers(String title, String message, String targetUrl);
}
