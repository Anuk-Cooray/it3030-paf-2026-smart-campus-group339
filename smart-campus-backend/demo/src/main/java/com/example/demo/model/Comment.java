package com.example.demo.model;

import java.time.LocalDateTime;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "comments")
public class Comment {

    @Id
    private String id;

    @Indexed
    private String ticketId;
    @Indexed
    private String userId;
    private String userName;
    private String text;
    private LocalDateTime createdAt = LocalDateTime.now();
}
