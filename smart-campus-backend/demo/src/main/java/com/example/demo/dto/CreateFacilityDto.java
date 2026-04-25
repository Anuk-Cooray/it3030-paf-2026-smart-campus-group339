package com.example.demo.dto;

import com.example.demo.model.FacilityStatus;
import com.example.demo.model.FacilityType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;


        @NotBlank String name,
        @NotNull FacilityType type,
        @NotNull @Min(1) Integer capacity,
        @NotBlank String location,
        FacilityStatus status,
        @NotEmpty @Valid List<FacilityAvailabilityWindowDto> availabilityWindows) {}