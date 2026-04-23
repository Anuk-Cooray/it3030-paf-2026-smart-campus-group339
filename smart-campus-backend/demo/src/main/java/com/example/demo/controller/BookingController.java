package com.example.demo.controller;

import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingStatusUpdateRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    private User getUserFromPrincipal(Object principal) {
        String email;
        if (principal instanceof Jwt jwt) {
            email = jwt.getClaimAsString("email");
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getBookings(@AuthenticationPrincipal Object principal) {
        User user = getUserFromPrincipal(principal);
        return ResponseEntity.ok(bookingService.getBookingsForUser(user));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@AuthenticationPrincipal Object principal,
            @Valid @RequestBody BookingRequest request) {
        User user = getUserFromPrincipal(principal);
        try {
            Booking booking = bookingService.createBooking(user, request);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@AuthenticationPrincipal Object principal,
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateRequest request) {
        User user = getUserFromPrincipal(principal);
        try {
            Booking booking = bookingService.updateBookingStatus(id, user, request.getStatus(),
                    request.getAdminReason());
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException | IllegalStateException | SecurityException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@AuthenticationPrincipal Object principal,
            @PathVariable Long id) {
        User user = getUserFromPrincipal(principal);
        try {
            bookingService.deleteBooking(id, user);
            return ResponseEntity.ok(Map.of("message", "Booking deleted successfully."));
        } catch (IllegalArgumentException | IllegalStateException | SecurityException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Feature 1: Heatmap availability endpoint
    // GET /api/bookings/availability?resource=Main+Auditorium&weekStart=2026-04-21
    @GetMapping("/availability")
    public ResponseEntity<?> getAvailability(
            @RequestParam String resource,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        try {
            return ResponseEntity.ok(bookingService.getWeeklyAvailability(resource, weekStart));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Feature 4: Export CSV endpoint
    // GET /api/bookings/export/csv?status=ALL
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @AuthenticationPrincipal Object principal,
            @RequestParam(defaultValue = "ALL") String status) {
        User user = getUserFromPrincipal(principal);
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Admin only.");
        }
        String csv = bookingService.exportToCsv(status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bookings.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}