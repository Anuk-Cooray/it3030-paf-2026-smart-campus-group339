package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingRequest {

    @NotBlank(message = "Resource name is required")
    private String resourceName;

    @NotNull(message = "Booking date is required")
    @FutureOrPresent(message = "Booking date cannot be in the past")
    private LocalDate bookingDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Purpose is required")
    @Size(max = 500, message = "Purpose cannot exceed 500 characters")
    private String purpose;

    @NotNull(message = "Expected attendees is required")
    @Min(value = 1, message = "At least 1 attendee required")
    @Max(value = 1000, message = "Attendees cannot exceed 1000")
    private Integer expectedAttendees;
}