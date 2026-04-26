package com.example.demo.service;

import com.example.demo.dto.NotificationDto;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void sendNotification(String userId, String message) {
        if (userId == null || userId.isBlank() || message == null || message.isBlank()) {
            return;
        }

        Long parsedUserId;
        try {
            parsedUserId = Long.valueOf(userId.trim());
        } catch (NumberFormatException ignored) {
            return;
        }

        User user = userRepository.findById(parsedUserId).orElse(null);
        if (user == null) {
            return;
        }

        createAndBroadcast(user, message);
    }

    public Notification createAndBroadcast(User user, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", toDto(saved));
        return saved;
    }

    private static NotificationDto toDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}
