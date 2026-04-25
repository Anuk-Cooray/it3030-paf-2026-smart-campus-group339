package com.example.demo.controller;

import com.example.demo.dto.CreateFacilityDto;
import com.example.demo.dto.FacilityAvailabilityWindowDto;
import com.example.demo.dto.FacilityDto;
import com.example.demo.dto.UpdateFacilityDto;
import com.example.demo.model.Facility;
import com.example.demo.model.FacilityAvailabilityWindow;
import com.example.demo.model.FacilityStatus;
import com.example.demo.model.FacilityType;
import com.example.demo.repository.FacilityRepository;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/facilities")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class FacilityController {

    private final FacilityRepository facilityRepository;

    public FacilityController(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<FacilityDto> createFacility(@Valid @RequestBody CreateFacilityDto dto) {
        try {
            validateAvailabilityWindows(dto.availabilityWindows());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }

        Facility facility = new Facility();
        applyDto(facility, dto.name(), dto.type(), dto.capacity(), dto.location(), dto.status(), dto.availabilityWindows());
        Facility saved = facilityRepository.save(facility);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @GetMapping
    public ResponseEntity<Page<FacilityDto>> listFacilities(
            @RequestParam(required = false) FacilityType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) FacilityStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Facility> specification = buildSpecification(type, capacity, minCapacity, location, status);
        Page<FacilityDto> facilities = facilityRepository.findAll(specification, pageable).map(FacilityController::toDto);
        return ResponseEntity.ok(facilities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityDto> getFacility(@PathVariable Long id) {
        return facilityRepository.findById(id).map(facility -> ResponseEntity.ok(toDto(facility))).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<FacilityDto> updateFacility(@PathVariable Long id, @Valid @RequestBody UpdateFacilityDto dto) {
        try {
            validateAvailabilityWindows(dto.availabilityWindows());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }

        return facilityRepository
                .findById(id)
                .map(
                        facility -> {
                            applyDto(
                                    facility,
                                    dto.name(),
                                    dto.type(),
                                    dto.capacity(),
                                    dto.location(),
                                    dto.status(),
                                    dto.availabilityWindows());
                            facility.setUpdatedAt(LocalDateTime.now());
                            Facility saved = facilityRepository.save(facility);
                            return ResponseEntity.ok(toDto(saved));
                        })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<FacilityDto> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateDto dto) {
        if (dto == null || dto.status() == null) {
            return ResponseEntity.badRequest().build();
        }

        return facilityRepository
                .findById(id)
                .map(
                        facility -> {
                            facility.setStatus(dto.status());
                            facility.setUpdatedAt(LocalDateTime.now());
                            Facility saved = facilityRepository.save(facility);
                            return ResponseEntity.ok(toDto(saved));
                        })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        return facilityRepository
                .findById(id)
                .map(
                        facility -> {
                            facilityRepository.delete(facility);
                            return ResponseEntity.noContent().<Void>build();
                        })
                .orElse(ResponseEntity.notFound().build());
    }

    private static Specification<Facility> buildSpecification(
            FacilityType type, Integer capacity, Integer minCapacity, String location, FacilityStatus status) {
        Specification<Facility> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (type != null) {
            specification = specification.and((root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("type"), type));
        }
       
            String normalizedLocation = "%" + location.trim().toLowerCase() + "%";
            specification = specification.and(
                    (root, query, criteriaBuilder) -> criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), normalizedLocation));
        }
        

    
            Facility facility,
            String name,
            FacilityType type,
            Integer capacity,
            String location,
            FacilityStatus status,
            List<FacilityAvailabilityWindowDto> availabilityWindows) {
        facility.setName(name.trim());
        facility.setType(type);
        facility.setCapacity(capacity);
        facility.setLocation(location.trim());
        facility.setStatus(status == null ? FacilityStatus.ACTIVE : status);
        facility.setAvailabilityWindows(mapWindows(availabilityWindows));
        facility.setUpdatedAt(LocalDateTime.now());
 
            facility.setCreatedAt(LocalDateTime.now());
        }
    }

   
        List<FacilityAvailabilityWindow> windows = new ArrayList<>();
       

  
        List<FacilityAvailabilityWindowDto> windows = new ArrayList<>();
        for (FacilityAvailabilityWindow window : facility.getAvailabilityWindows()) {
            windows.add(new FacilityAvailabilityWindowDto(window.getDayOfWeek(), window.getStartTime(), window.getEndTime()));
        }

        return new FacilityDto(
                facility.getId(),
                facility.getName(),
                facility.getType(),
                facility.getCapacity(),
                facility.getLocation(),
                facility.getStatus(),
                windows,
                facility.getCreatedAt(),
                facility.getUpdatedAt());
    }

    
        if (availabilityWindows == null || availabilityWindows.isEmpty()) {
            throw new IllegalArgumentException("At least one availability window is required");
        }

 
            if (dto.dayOfWeek() == null || dto.startTime() == null || dto.endTime() == null) {
                throw new IllegalArgumentException("Availability windows must include day, start time, and end time");
            }
            if (!dto.startTime().isBefore(dto.endTime())) {
                throw new IllegalArgumentException("Availability window start time must be before end time");
            }
        }
    }

    public record StatusUpdateDto(FacilityStatus status) {}
}