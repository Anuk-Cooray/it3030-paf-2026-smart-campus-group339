package com.example.demo.repository;

import com.example.demo.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

// ✅ JpaRepository → MongoRepository
// ✅ Long → String (MongoDB ObjectId)
// ✅ JPQL @Query → MongoDB JSON @Query
// ✅ findAllByStatusOptional → separate methods (MongoDB doesn't support JPQL IS NULL check the same way)

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

        // User ගේ bookings — createdAt desc order
        List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

        // Admin — සියලු bookings
        List<Booking> findAllByOrderByCreatedAtDesc();

        // Conflict check — same resource, same date, overlapping time, PENDING/APPROVED
        // only
        @Query("{ 'resourceName': ?0, 'bookingDate': ?1, 'status': { $in: ['PENDING', 'APPROVED'] }, " +
                        "'startTime': { $lt: ?3 }, 'endTime': { $gt: ?2 } }")
        List<Booking> findOverlappingBookings(
                        String resourceName,
                        LocalDate bookingDate,
                        LocalTime newStartTime,
                        LocalTime newEndTime);

        // Heatmap: resource + date range, PENDING/APPROVED only
        @Query("{ 'resourceName': ?0, 'bookingDate': { $gte: ?1, $lte: ?2 }, 'status': { $in: ['PENDING', 'APPROVED'] } }")
        List<Booking> findBookingsForResourceBetweenDates(
                        String resourceName,
                        LocalDate startDate,
                        LocalDate endDate);

        // Export: status filter — ALL or specific status
        List<Booking> findByStatusOrderByCreatedAtDesc(String status);

        // Status filter — admin panel
        List<Booking> findByStatus(String status);
}