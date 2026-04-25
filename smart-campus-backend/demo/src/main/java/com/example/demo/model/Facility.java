package com.example.demo.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Data;

@Data
@Entity
@Table(name = "facilities")
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type; // Lecture Hall, Lab, Equipment, etc.
    private Integer capacity;
    private String location;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "facility_availability_windows", joinColumns = @JoinColumn(name = "facility_id"))
    @Column(name = "availability_window")
    private List<String> availabilityWindows;

    private String status; // ACTIVE / OUT_OF_SERVICE
}
