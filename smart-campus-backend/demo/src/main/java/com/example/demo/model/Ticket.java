package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "tickets")
public class Ticket {

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH
    }

    public enum Status {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED,
        REJECTED
    }

    @Id
    private String id;

    @Indexed
    private String userId;
    private String userName;
    private String resourceLocation;
    private String category;
    private String description;
    private Priority priority = Priority.MEDIUM;
    private String contactDetails;
    private Status status = Status.OPEN;
    private String assignedTech;
    private String resolutionNotes;
    private LocalDateTime createdAt = LocalDateTime.now();
    private List<String> imageAttachments = new ArrayList<>();
}
