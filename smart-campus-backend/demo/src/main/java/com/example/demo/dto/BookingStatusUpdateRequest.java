package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class BookingStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "APPROVED|REJECTED|CANCELLED", message = "Status must be APPROVED, REJECTED, or CANCELLED")
    private String status;

    private String adminReason;
}