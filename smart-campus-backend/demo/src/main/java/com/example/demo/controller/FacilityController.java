package com.example.demo.controller;

import com.example.demo.model.Facility;
import com.example.demo.repository.FacilityRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/facilities")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class FacilityController {

    private final FacilityRepository facilityRepository;

    public FacilityController(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    @GetMapping
    public List<Facility> listAll() {
        return facilityRepository.findAll();
    }

    @PostMapping
    public Facility create(@RequestBody Facility facility) {
        facility.setId(null);
        return facilityRepository.save(facility);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Facility> update(@PathVariable Long id, @RequestBody Facility payload) {
        return facilityRepository
                .findById(id)
                .map(
                        existing -> {
                            existing.setName(payload.getName());
                            existing.setType(payload.getType());
                            existing.setCapacity(payload.getCapacity());
                            existing.setLocation(payload.getLocation());
                            existing.setAvailabilityWindows(payload.getAvailabilityWindows());
                            existing.setStatus(payload.getStatus());
                            return ResponseEntity.ok(facilityRepository.save(existing));
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!facilityRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        facilityRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
