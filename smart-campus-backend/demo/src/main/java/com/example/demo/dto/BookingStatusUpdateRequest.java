package com.example.demo.dto;

import lombok.Data;

@Data
public class BookingStatusUpdateRequest {
    private String status; // APPROVED, REJECTED, CANCELLED
    private String adminReason;
}
