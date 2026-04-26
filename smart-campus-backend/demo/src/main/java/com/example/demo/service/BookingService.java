package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.model.Booking;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
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
    private final NotificationService notificationService;

    public List<Booking> getBookingsForUser(User user, String status) {
        List<Booking> bookings;
        if ("ROLE_ADMIN".equals(user.getRole())) {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        } else {
            bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }
        if (status != null && !status.equals("ALL") && !status.isBlank()) {
            bookings = bookings.stream()
                    .filter(b -> b.getStatus().equals(status))
                    .toList();
        }
        return bookings;
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

            notificationService.sendNotification(
                    String.valueOf(booking.getUser().getId()),
                    "Your booking for " + booking.getResourceName() + " on "
                            + booking.getBookingDate() + " has been " + status + ".");

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

    // Feature 1: Heatmap
    public Map<String, List<Map<String, String>>> getWeeklyAvailability(String resourceName, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<Booking> bookings = bookingRepository.findBookingsForResourceBetweenDates(resourceName, weekStart, weekEnd);

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

    // Feature 4a: Export CSV
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

    // Feature 4b: Export PDF
    public byte[] exportToPdf(String status) {
        List<Booking> bookings = (status == null || status.equals("ALL"))
                ? bookingRepository.findAllByOrderByCreatedAtDesc()
                : bookingRepository.findAllByStatusOptional(status);

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, baos);
            document.open();

            // Title
            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, new BaseColor(79, 70, 229));
            Paragraph title = new Paragraph("Smart Campus — Booking Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6);
            document.add(title);

            // Subtitle
            Font subFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.GRAY);
            Paragraph sub = new Paragraph("Status: " + (status == null || status.equals("ALL") ? "All" : status)
                    + "   |   Generated: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), subFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(16);
            document.add(sub);

            // Table — 7 columns
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.2f, 2f, 1.4f, 1.2f, 1.2f, 2f, 1.3f});
            table.setSpacingBefore(4);

            Font headerFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE);
            Font cellFont  = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, new BaseColor(31, 41, 55));

            // Header row
            for (String h : new String[]{"Resource", "User", "Date", "Start", "End", "Purpose", "Status"}) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new BaseColor(79, 70, 229));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(9);
                cell.setBorderColor(BaseColor.WHITE);
                table.addCell(cell);
            }

            // Data rows
            boolean alternate = false;
            for (Booking b : bookings) {
                BaseColor rowColor = alternate ? new BaseColor(238, 242, 255) : BaseColor.WHITE;

                // Status color
                BaseColor statusColor;
                switch (b.getStatus() != null ? b.getStatus() : "") {
                    case "APPROVED"  -> statusColor = new BaseColor(16, 185, 129);
                    case "REJECTED"  -> statusColor = new BaseColor(239, 68, 68);
                    case "CANCELLED" -> statusColor = new BaseColor(107, 114, 128);
                    default          -> statusColor = new BaseColor(245, 158, 11);
                }

                String userName = b.getUser() != null
                        ? (b.getUser().getName() != null ? b.getUser().getName() : b.getUser().getEmail())
                        : "-";

                String[] values = {
                    b.getResourceName() != null ? b.getResourceName() : "-",
                    userName,
                    b.getBookingDate() != null ? b.getBookingDate().toString() : "-",
                    b.getStartTime()   != null ? b.getStartTime().toString()   : "-",
                    b.getEndTime()     != null ? b.getEndTime().toString()     : "-",
                    b.getPurpose()     != null ? b.getPurpose()               : "-",
                    b.getStatus()      != null ? b.getStatus()                : "-"
                };

                for (int i = 0; i < values.length; i++) {
                    Font f = (i == 6)
                            ? new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, statusColor)
                            : cellFont;
                    PdfPCell cell = new PdfPCell(new Phrase(values[i], f));
                    cell.setBackgroundColor(rowColor);
                    cell.setPadding(7);
                    cell.setBorderColor(new BaseColor(229, 231, 235));
                    cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    table.addCell(cell);
                }
                alternate = !alternate;
            }

            document.add(table);

            // Footer
            Font footerFont = new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, BaseColor.GRAY);
            Paragraph footer = new Paragraph("Total: " + bookings.size() + " booking(s)", footerFont);
            footer.setAlignment(Element.ALIGN_RIGHT);
            footer.setSpacingBefore(10);
            document.add(footer);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed: " + e.getMessage());
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}