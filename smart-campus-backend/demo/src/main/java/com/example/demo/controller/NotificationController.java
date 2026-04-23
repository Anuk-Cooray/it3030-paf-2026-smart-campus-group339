package com.example.demo.controller;

import com.example.demo.dto.NotificationDto;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<NotificationDto> listMine(Authentication authentication) {
        User user = resolveUser(authentication);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(NotificationController::toDto)
                .toList();
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markRead(Authentication authentication, @PathVariable Long id) {
        User user = resolveUser(authentication);
        return notificationRepository
                .findByIdAndUser(id, user)
                .map(
                        notification -> {
                            notification.setRead(true);
                            notificationRepository.save(notification);
                            return ResponseEntity.ok(toDto(notification));
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMine(Authentication authentication, @PathVariable Long id) {
        User user = resolveUser(authentication);
        return notificationRepository
                .findByIdAndUser(id, user)
                .map(
                        notification -> {
                            notificationRepository.delete(notification);
                            return ResponseEntity.noContent().<Void>build();
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    private static NotificationDto toDto(Notification n) {
        return new NotificationDto(n.getId(), n.getMessage(), n.isRead(), n.getCreatedAt());
    }
}
