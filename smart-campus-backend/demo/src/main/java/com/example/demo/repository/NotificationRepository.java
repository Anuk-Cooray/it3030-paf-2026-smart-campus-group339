package com.example.demo.repository;

import com.example.demo.model.Notification;
import com.example.demo.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    Optional<Notification> findByIdAndUser(Long id, User user);
}
