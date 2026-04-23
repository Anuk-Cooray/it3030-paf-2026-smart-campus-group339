package com.example.demo.controller;

import com.example.demo.model.Booking;
import com.example.demo.model.Booking.Status;
import com.example.demo.model.Notification;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.service.BookingService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class BookingController {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final NotificationRepository notificationRepository;

    public BookingController(
            BookingRepository bookingRepository,
            BookingService bookingService,
            NotificationRepository notificationRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<Booking> list(@RequestParam(required = false) String status) {
        if (status == null || status.isBlank()) {
            return bookingRepository.findAll();
        }
        Status parsed = Status.valueOf(status.trim().toUpperCase());
        return bookingRepository.findByStatus(parsed);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id) {
        return bookingRepository
                .findById(id)
                .map(
                        booking -> {
                            if (bookingService.isConflict(booking)) {
                                return ResponseEntity.badRequest().body(Map.of("error", "Schedule Conflict"));
                            }

                            booking.setStatus(Status.APPROVED);
                            booking.setRejectionReason(null);
                            bookingRepository.save(booking);
                            notifyUser(
                                    booking.getUserId(),
                                    "Your booking request for resource "
                                            + booking.getResourceId()
                                            + " was approved.");
                            return ResponseEntity.ok(booking);
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id, @RequestBody Map<String, String> payload) {
        return bookingRepository
                .findById(id)
                .map(
                        booking -> {
                            String reason = payload == null ? null : payload.get("rejectionReason");
                            booking.setStatus(Status.REJECTED);
                            booking.setRejectionReason(reason == null ? "" : reason.trim());
                            bookingRepository.save(booking);
                            notifyUser(
                                    booking.getUserId(),
                                    "Your booking request for resource "
                                            + booking.getResourceId()
                                            + " was rejected."
                                            + (booking.getRejectionReason().isBlank()
                                                    ? ""
                                                    : " Reason: " + booking.getRejectionReason()));
                            return ResponseEntity.ok(booking);
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private void notifyUser(String userId, String message) {
        if (userId == null || userId.isBlank()) return;
        Notification n = new Notification();
        n.setUserId(userId);
        n.setMessage(message);
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }
}
