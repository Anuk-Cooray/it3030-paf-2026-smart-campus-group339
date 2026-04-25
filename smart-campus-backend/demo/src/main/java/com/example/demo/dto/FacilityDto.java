package com.example.demo.dto;

import com.example.demo.model.FacilityStatus;
import com.example.demo.model.FacilityType;
import java.time.LocalDateTime;
import java.util.List;

public record FacilityDto(
        Long id,
        String name,
        FacilityType type,
        Integer capacity,
        String location,
        FacilityStatus status,
        List<FacilityAvailabilityWindowDto> availabilityWindows,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}