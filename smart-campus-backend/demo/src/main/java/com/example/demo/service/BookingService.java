package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
        if (request.getStartTime().isAfter(request.getEndTime())
                || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

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

            if ("REJECTED".equals(status)) {
                if (adminReason == null || adminReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("A reason is required when rejecting a booking.");
                }
                booking.setAdminReason(adminReason.trim());
            }

            booking.setStatus(status);

            Notification notification = new Notification();
            notification.setUser(booking.getUser());
            notification.setMessage("Your booking for " + booking.getResourceName() + " on " + booking.getBookingDate()
                    + " has been " + status + ".");
            notificationRepository.save(notification);

        } else if ("CANCELLED".equals(status)) {
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

    public void deleteBooking(Long bookingId, User user) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        if ("ROLE_ADMIN".equals(user.getRole())) {
            bookingRepository.delete(booking);
        } else if (booking.getUser().getId().equals(user.getId())) {
            if (!"CANCELLED".equals(booking.getStatus()) && !"REJECTED".equals(booking.getStatus())) {
                throw new IllegalStateException("You can only delete cancelled or rejected bookings.");
            }
            bookingRepository.delete(booking);
        } else {
            throw new SecurityException("You do not have permission to delete this booking.");
        }
    }

    // Feature 1: Heatmap — resource + week availability
    public Map<String, List<Map<String, String>>> getWeeklyAvailability(String resourceName, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<Booking> bookings = bookingRepository.findBookingsForResourceBetweenDates(resourceName, weekStart,
                weekEnd);

        List<LocalTime> slotStarts = new ArrayList<>();
        for (int h = 8; h < 20; h++) {
            slotStarts.add(LocalTime.of(h, 0));
        }

        Map<String, List<Map<String, String>>> result = new LinkedHashMap<>();

        for (int i = 0; i <= 6; i++) {
            LocalDate date = weekStart.plusDays(i);
            String dateStr = date.toString();
            List<Map<String, String>> slots = new ArrayList<>();

            for (LocalTime slotStart : slotStarts) {
                LocalTime slotEnd = slotStart.plusHours(1);
                String slotLabel = slotStart + "-" + slotEnd;

                boolean busy = bookings.stream().anyMatch(b -> b.getBookingDate().equals(date) &&
                        b.getStartTime().isBefore(slotEnd) &&
                        b.getEndTime().isAfter(slotStart));

                slots.add(Map.of("slot", slotLabel, "status", busy ? "BUSY" : "FREE"));
            }

            result.put(dateStr, slots);
        }

        return result;
    }

    // Feature 4: Export CSV
    public String exportToCsv(String status) {
        List<Booking> bookings = (status == null || status.equals("ALL"))
                ? bookingRepository.findAllByOrderByCreatedAtDesc()
                : bookingRepository.findAllByStatusOptional(status);

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);

        pw.println("ID,Resource,Date,Start Time,End Time,Status,User,Purpose,Attendees,Admin Note,Created At");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (Booking b : bookings) {
            pw.printf("%d,%s,%s,%s,%s,%s,%s,\"%s\",%d,\"%s\",%s%n",
                    b.getId(),
                    escapeCsv(b.getResourceName()),
                    b.getBookingDate(),
                    b.getStartTime(),
                    b.getEndTime(),
                    b.getStatus(),
                    escapeCsv(b.getUser() != null ? b.getUser().getEmail() : ""),
                    escapeCsv(b.getPurpose()),
                    b.getExpectedAttendees() != null ? b.getExpectedAttendees() : 0,
                    escapeCsv(b.getAdminReason() != null ? b.getAdminReason() : ""),
                    b.getCreatedAt() != null ? b.getCreatedAt().format(dtf) : "");
        }

        return sw.toString();
    }

    private String escapeCsv(String value) {
        if (value == null)
            return "";
        return value.replace("\"", "\"\"");
    }
}
