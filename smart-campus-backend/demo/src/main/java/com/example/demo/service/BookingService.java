package com.example.demo.service;

import com.example.demo.model.Booking;
import com.example.demo.model.Booking.Status;
import com.example.demo.repository.BookingRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public boolean isConflict(Booking newBooking) {
        List<Booking> existingApproved =
                bookingRepository.findByResourceIdAndStatus(newBooking.getResourceId(), Status.APPROVED);

        for (Booking existing : existingApproved) {
            // Overlap check: (newStart < existingEnd) && (newEnd > existingStart)
            boolean overlap =
                    newBooking.getStartTime().isBefore(existing.getEndTime())
                            && newBooking.getEndTime().isAfter(existing.getStartTime());
            if (overlap) {
                return true;
            }
        }
        return false;
    }
}
