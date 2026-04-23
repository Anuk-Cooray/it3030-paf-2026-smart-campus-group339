package com.example.demo.dto;

import java.util.List;

public record CreateTicketDto(
                String resource,
                String location,
                String category,
                String description,
                String priority,
                String contactDetails,
                List<String> attachments) {
}
