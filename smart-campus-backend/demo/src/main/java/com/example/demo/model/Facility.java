package com.example.demo.model;

import java.util.List;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "facilities")
public class Facility {

    @Id
    private String id;

    private String name;
    private String type; // Lecture Hall, Lab, Equipment, etc.
    private Integer capacity;
    private String location;
    private List<String> availabilityWindows;
    private String status; // ACTIVE / OUT_OF_SERVICE
}
