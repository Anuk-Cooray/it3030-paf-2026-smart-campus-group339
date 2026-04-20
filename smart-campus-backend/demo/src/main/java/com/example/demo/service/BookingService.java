package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;

    public List<Booking> getBookingsForUser(User user) {
        if ("ROLE_ADMIN".equals(user.getRole())) {
            return bookingRepository.findAllByOrderByCreatedAtDesc();
        }
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public Booking createBooking(User user, BookingRequest request) {
        // Validate time range
        if (request.getStartTime().isAfter(request.getEndTime())
                || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // Check for conflicts
        List<Booking> conflicts = bookingRepository.findOverlappingBookings(
                request.getResourceName(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("The resource is already booked for the selected time range.");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setResourceName(request.getResourceName());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setStatus("PENDING");

        return bookingRepository.save(booking);
    }

    public Booking updateBookingStatus(Long bookingId, User user, String status, String adminReason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        if ("APPROVED".equals(status) || "REJECTED".equals(status)) {
            if (!"ROLE_ADMIN".equals(user.getRole())) {
                throw new SecurityException("Only admins can approve or reject bookings.");
            }

            // ✅ Fix: REJECTED වෙද්දී adminReason validate කරනවා
            if ("REJECTED".equals(status)) {
                if (adminReason == null || adminReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("A reason is required when rejecting a booking.");
                }
                booking.setAdminReason(adminReason.trim());
            }

            booking.setStatus(status);

            // Create notification for the user
            Notification notification = new Notification();
            notification.setUser(booking.getUser());
            notification.setMessage("Your booking for " + booking.getResourceName() + " on " + booking.getBookingDate()
                    + " has been " + status + ".");
            notificationRepository.save(notification);

        } else if ("CANCELLED".equals(status)) {
            // User can cancel their own pending/approved bookings, admin can cancel any
            if (!"ROLE_ADMIN".equals(user.getRole()) && !booking.getUser().getId().equals(user.getId())) {
                throw new SecurityException("You can only cancel your own bookings.");
            }
            if ("REJECTED".equals(booking.getStatus())) {
                throw new IllegalStateException("Cannot cancel a rejected booking.");
            }
            booking.setStatus(status);
        } else {
            throw new IllegalArgumentException("Invalid status update.");
        }

        return bookingRepository.save(booking);
    }

    // ✅ Fix: DELETE method — assignment requirement
    public void deleteBooking(Long bookingId, User user) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        // Only admin can delete any booking; user can only delete their own
        // CANCELLED/REJECTED bookings
        if ("ROLE_ADMIN".equals(user.getRole())) {
            bookingRepository.delete(booking);
        } else if (booking.getUser().getId().equals(user.getId())) {
            if (!"CANCELLED".equals(booking.getStatus()) && !"REJECTED".equals(booking.getStatus())) {
                throw new IllegalStateException("You can only delete cancelled or rejected bookings. Cancel it first.");
            }
            bookingRepository.delete(booking);
        } else {
            throw new SecurityException("You do not have permission to delete this booking.");
        }
    }
}