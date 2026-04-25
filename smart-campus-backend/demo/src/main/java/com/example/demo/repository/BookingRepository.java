package com.example.demo.repository;

import com.example.demo.model.Booking;
import com.example.demo.model.Booking.Status;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByResourceIdAndStatus(String resourceId, Status status);

    List<Booking> findByStatus(Status status);
}
