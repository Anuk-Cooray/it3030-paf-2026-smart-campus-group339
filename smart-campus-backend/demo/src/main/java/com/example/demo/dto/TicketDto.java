package com.example.demo.dto;

import java.time.LocalDateTime;

public record TicketDto(
        Long id,
        String resource,
        String location,
        String category,
        String description,
        String priority,
        String contactDetails,
        String status,
        String userName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
