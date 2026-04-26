package com.example.demo.controller;

import com.example.demo.dto.NotificationDto;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.NotificationService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public NotificationController(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDto> listMine(Authentication authentication) {
        User user = resolveUser(authentication);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(NotificationController::toDto)
                .toList();
    }

    @PatchMapping("/{id}/read")
    @Transactional
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
    @Transactional
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

    @GetMapping("/admin")
    public List<AdminNotificationDto> listAllForAdmin() {
        return notificationRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(NotificationController::toAdminDto)
                .toList();
    }

    @PostMapping("/admin")
    @Transactional
    public ResponseEntity<?> createForUser(@RequestBody AdminNotificationCreateRequest request) {
        Optional<User> userOpt = resolveTargetUser(request);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Target user not found");
        }
        if (request.message() == null || request.message().isBlank()) {
            return ResponseEntity.badRequest().body("Message is required");
        }

        Notification saved = notificationService.createAndBroadcast(userOpt.get(), request.message().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(toAdminDto(saved));
    }

    @PutMapping("/admin/{id}")
    @Transactional
    public ResponseEntity<?> updateNotification(
            @PathVariable Long id, @RequestBody AdminNotificationUpdateRequest request) {
        return notificationRepository
                .findById(id)
                .map(notification -> {
                    if (request.message() != null && !request.message().isBlank()) {
                        notification.setMessage(request.message().trim());
                    }
                    if (request.read() != null) {
                        notification.setRead(request.read());
                    }
                    Notification saved = notificationRepository.save(notification);
                    return ResponseEntity.ok(toAdminDto(saved));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/admin/{id}")
    @Transactional
    public ResponseEntity<Void> deleteAny(@PathVariable Long id) {
        if (!notificationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        notificationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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

    private Optional<User> resolveTargetUser(AdminNotificationCreateRequest request) {
        if (request == null) {
            return Optional.empty();
        }
        if (request.userId() != null) {
            return userRepository.findById(request.userId());
        }
        if (request.email() != null && !request.email().isBlank()) {
            return userRepository.findByEmail(request.email().trim());
        }
        if (request.studentId() != null && !request.studentId().isBlank()) {
            return userRepository.findByStudentId(request.studentId().trim());
        }
        return Optional.empty();
    }

    private static AdminNotificationDto toAdminDto(Notification n) {
        User user = n.getUser();
        return new AdminNotificationDto(
                n.getId(),
                user == null ? null : user.getId(),
                user == null ? null : user.getEmail(),
                user == null ? null : user.getName(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt());
    }

    public record AdminNotificationCreateRequest(Long userId, String email, String studentId, String message) {}

    public record AdminNotificationUpdateRequest(String message, Boolean read) {}

    public record AdminNotificationDto(
            Long id,
            Long userId,
            String userEmail,
            String userName,
            String message,
            boolean read,
            LocalDateTime createdAt) {}
}
