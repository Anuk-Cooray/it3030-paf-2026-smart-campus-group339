package com.example.demo.repository;

import com.example.demo.model.Booking;
import com.example.demo.model.Booking.Status;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByResourceIdAndStatus(String resourceId, Status status);

    List<Booking> findByStatus(Status status);
}
