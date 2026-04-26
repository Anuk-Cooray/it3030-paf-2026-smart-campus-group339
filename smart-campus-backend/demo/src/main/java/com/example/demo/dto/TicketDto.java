package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TicketDto(
                Long id,
                String resource,
                String location,
                String category,
                String description,
                String priority,
                String contactDetails,
                List<String> attachments,
                String status,
                String assignedTechnician,
                String userName,
                LocalDateTime createdAt,
                LocalDateTime updatedAt) {
}
