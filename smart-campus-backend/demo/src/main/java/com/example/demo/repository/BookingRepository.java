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
            @Param("newEndTime") LocalTime newEndTime
    );
}
