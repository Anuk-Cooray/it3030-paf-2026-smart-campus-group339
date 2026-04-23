package com.example.demo.dto;

public record AuthResponseDto(
        String token,
        String userId,
        String email,
        String name,
        String role,
        String studentId,
        boolean needsProfileSetup) {}
