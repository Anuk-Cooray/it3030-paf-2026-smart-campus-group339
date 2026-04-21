package com.example.demo.dto;

public record CreateTicketDto(
        String resource, String location, String category, String description, String priority, String contactDetails) {}
