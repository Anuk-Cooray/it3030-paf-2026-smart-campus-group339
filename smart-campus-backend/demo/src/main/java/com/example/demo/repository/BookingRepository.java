package com.example.demo.repository;

import com.example.demo.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

        List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

        List<Booking> findAllByOrderByCreatedAtDesc();

        @Query("SELECT b FROM Booking b WHERE b.resourceName = :resourceName " +
                        "AND b.bookingDate = :bookingDate " +
                        "AND b.status IN ('PENDING', 'APPROVED') " +
                        "AND ((b.startTime < :newEndTime AND b.endTime > :newStartTime))")
        List<Booking> findOverlappingBookings(
                        @Param("resourceName") String resourceName,
                        @Param("bookingDate") LocalDate bookingDate,
                        @Param("newStartTime") LocalTime newStartTime,
                        @Param("newEndTime") LocalTime newEndTime);

        // ✅ Heatmap: resource එකක් given week ලෝ bookings
        @Query("SELECT b FROM Booking b WHERE b.resourceName = :resourceName " +
                        "AND b.bookingDate BETWEEN :startDate AND :endDate " +
                        "AND b.status IN ('PENDING', 'APPROVED')")
        List<Booking> findBookingsForResourceBetweenDates(
                        @Param("resourceName") String resourceName,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        // ✅ Export: admin සඳහා සියලු bookings (optional status filter)
        @Query("SELECT b FROM Booking b WHERE (:status IS NULL OR b.status = :status) " +
                        "ORDER BY b.createdAt DESC")
        List<Booking> findAllByStatusOptional(@Param("status") String status);
}
