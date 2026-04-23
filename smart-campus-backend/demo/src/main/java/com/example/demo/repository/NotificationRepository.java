package com.example.demo.repository;

import com.example.demo.model.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<Notification> findByIdAndUserId(String id, String userId);
}
