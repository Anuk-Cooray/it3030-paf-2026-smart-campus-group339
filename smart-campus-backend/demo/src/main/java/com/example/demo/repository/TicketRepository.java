package com.example.demo.repository;

import com.example.demo.model.Ticket;
import com.example.demo.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    @Query("SELECT t FROM Ticket t JOIN FETCH t.user ORDER BY t.createdAt DESC")
    List<Ticket> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Ticket t JOIN FETCH t.user WHERE t.user = :user ORDER BY t.createdAt DESC")
    List<Ticket> findByUserOrderByCreatedAtDesc(User user);

    Optional<Ticket> findByIdAndUser(Long id, User user);
}
