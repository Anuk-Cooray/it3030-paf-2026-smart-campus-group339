package com.example.demo.repository;

import com.example.demo.model.Ticket;
import com.example.demo.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByUserOrderByCreatedAtDesc(User user);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    Optional<Ticket> findByIdAndUser(Long id, User user);
}
