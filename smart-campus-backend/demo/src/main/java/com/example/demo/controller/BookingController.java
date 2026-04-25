package com.example.demo.controller;

import com.example.demo.model.Booking;
import com.example.demo.model.Booking.Status;
import com.example.demo.repository.BookingRepository;
import com.example.demo.service.BookingService;
import com.example.demo.service.NotificationService;
import java.time.format.DateTimeFormatter;
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
    private final NotificationService notificationService;

    public BookingController(
            BookingRepository bookingRepository,
            BookingService bookingService,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.notificationService = notificationService;
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
    public ResponseEntity<?> approve(@PathVariable Long id) {
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
                            notificationService.sendNotification(
                                    String.valueOf(booking.getUserId()),
                                    "Your booking for "
                                            + booking.getResourceId()
                                            + " on "
                                            + formatBookingDate(booking)
                                            + " has been APPROVED.");
                            return ResponseEntity.ok(booking);
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return bookingRepository
                .findById(id)
                .map(
                        booking -> {
                            String reason = payload == null ? null : payload.get("rejectionReason");
                            booking.setStatus(Status.REJECTED);
                            booking.setRejectionReason(reason == null ? "" : reason.trim());
                            bookingRepository.save(booking);
                            String adminReason =
                                    booking.getRejectionReason().isBlank()
                                            ? "No reason provided"
                                            : booking.getRejectionReason();
                            notificationService.sendNotification(
                                    String.valueOf(booking.getUserId()),
                                    "Your booking for "
                                            + booking.getResourceId()
                                            + " on "
                                            + formatBookingDate(booking)
                                            + " was REJECTED. Reason: "
                                            + adminReason);
                            return ResponseEntity.ok(booking);
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private static String formatBookingDate(Booking booking) {
        if (booking.getStartTime() == null) {
            return "the selected date";
        }
        return booking.getStartTime().format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
