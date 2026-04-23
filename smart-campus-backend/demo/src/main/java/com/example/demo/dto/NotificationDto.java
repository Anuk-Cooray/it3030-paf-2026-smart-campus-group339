package com.example.demo.dto;

import java.time.LocalDateTime;

public record NotificationDto(String id, String message, boolean read, LocalDateTime createdAt) {}
