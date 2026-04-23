package com.example.demo.repository;

import com.example.demo.model.Ticket;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByUserIdOrderByCreatedAtDesc(String userId);
}
