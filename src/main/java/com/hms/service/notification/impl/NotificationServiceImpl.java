package com.hms.service.notification.impl;

import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.notification.response.NotificationResponse;
import com.hms.entity.auth.User;
import com.hms.entity.notification.UserNotification;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.notification.UserNotificationRepository;
import com.hms.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import com.hms.common.enums.AccountStatus;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void notify(User recipient, String title, String message, String targetUrl) {
        if (recipient == null) {
            return;
        }
        notificationRepository.save(UserNotification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .targetUrl(targetUrl)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String email, int limit) {
        User user = findUser(email);
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return notificationRepository.findByRecipient_IdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(String email) {
        User user = findUser(email);
        return notificationRepository.countByRecipient_IdAndReadFalse(user.getId());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(String email, Long notificationId) {
        User user = findUser(email);
        UserNotification notification = notificationRepository.findById(notificationId)
                .filter(item -> item.getRecipient() != null && item.getRecipient().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    private User findUser(String email) {
        return userRepository.findUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private NotificationResponse toResponse(UserNotification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .targetUrl(notification.getTargetUrl())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void notifyReceptionistsAndManagers(String title, String message, String targetUrl) {
        List<User> recipients = new java.util.ArrayList<>();
        recipients.addAll(userRepository.findByRole_RoleNameIgnoreCaseAndAccountStatus("RECEPTIONIST", AccountStatus.ACTIVE));
        recipients.addAll(userRepository.findByRole_RoleNameIgnoreCaseAndAccountStatus("MANAGER", AccountStatus.ACTIVE));
        for (User recipient : recipients) {
            notify(recipient, title, message, targetUrl);
        }
    }

    @Override
    @Transactional
    public void notifyManagers(String title, String message, String targetUrl) {
        List<User> managers = userRepository.findByRole_RoleNameIgnoreCaseAndAccountStatus("MANAGER", AccountStatus.ACTIVE);
        for (User manager : managers) {
            notify(manager, title, message, targetUrl);
        }
    }
}
