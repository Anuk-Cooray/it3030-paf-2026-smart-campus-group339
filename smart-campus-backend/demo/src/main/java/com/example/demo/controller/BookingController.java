package com.example.demo.controller;

import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingStatusUpdateRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    private User getUserFromJwt(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getBookings(@AuthenticationPrincipal Jwt jwt) {
        User user = getUserFromJwt(jwt);
        return ResponseEntity.ok(bookingService.getBookingsForUser(user));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@AuthenticationPrincipal Jwt jwt, @RequestBody BookingRequest request) {
        User user = getUserFromJwt(jwt);
        try {
            Booking booking = bookingService.createBooking(user, request);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@AuthenticationPrincipal Jwt jwt, 
                                                 @PathVariable Long id, 
                                                 @RequestBody BookingStatusUpdateRequest request) {
        User user = getUserFromJwt(jwt);
        try {
            Booking booking = bookingService.updateBookingStatus(id, user, request.getStatus(), request.getAdminReason());
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException | IllegalStateException | SecurityException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
