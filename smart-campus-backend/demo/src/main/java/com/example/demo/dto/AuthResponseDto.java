package com.example.demo.dto;

public record AuthResponseDto(
        String token,
        Long userId,
        String email,
        String name,
        String role,
        String studentId,
        boolean needsProfileSetup) {}
