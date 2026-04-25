package com.example.demo.controller;

import com.example.demo.dto.CreateTicketDto;
import com.example.demo.dto.TicketDto;
import com.example.demo.model.Ticket;
import com.example.demo.model.User;
import com.example.demo.repository.TicketRepository;
import com.example.demo.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class TicketController {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketController(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<TicketDto> createTicket(
            Authentication authentication, @RequestBody CreateTicketDto createTicketDto) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<String> attachments;
        try {
            attachments = sanitizeAttachments(createTicketDto.attachments());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Ticket ticket = new Ticket();
        ticket.setUser(user);
        ticket.setResource(createTicketDto.resource());
        ticket.setLocation(createTicketDto.location());
        ticket.setCategory(createTicketDto.category());
        ticket.setDescription(createTicketDto.description());
        ticket.setPriority(createTicketDto.priority());
        ticket.setContactDetails(createTicketDto.contactDetails());
        ticket.setAttachment1(attachments.size() > 0 ? attachments.get(0) : null);
        ticket.setAttachment2(attachments.size() > 1 ? attachments.get(1) : null);
        ticket.setAttachment3(attachments.size() > 2 ? attachments.get(2) : null);
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket savedTicket = ticketRepository.save(ticket);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(savedTicket));
    }

    @GetMapping
    public ResponseEntity<List<TicketDto>> listAllTickets() {
        List<Ticket> tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        List<TicketDto> dtos = tickets.stream().map(TicketController::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<List<TicketDto>> listMyTickets(Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Ticket> tickets = ticketRepository.findByUserOrderByCreatedAtDesc(user);
        List<TicketDto> dtos = tickets.stream().map(TicketController::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDto> getTicket(@PathVariable Long id) {
        return ticketRepository
                .findById(id)
                .map(ticket -> ResponseEntity.ok(toDto(ticket)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<TicketDto> updateTicketStatus(
            Authentication authentication, @PathVariable Long id, @RequestBody StatusUpdateDto statusUpdate) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ticketRepository
                .findByIdAndUser(id, user)
                .map(
                        ticket -> {
                            ticket.setStatus(statusUpdate.status());
                            ticket.setUpdatedAt(LocalDateTime.now());
                            Ticket updated = ticketRepository.save(ticket);
                            return ResponseEntity.ok(toDto(updated));
                        })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTicket(Authentication authentication, @PathVariable Long id) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ticketRepository
                .findByIdAndUser(id, user)
                .map(
                        ticket -> {
                            ticketRepository.delete(ticket);
                            return ResponseEntity.noContent().<Void>build();
                        })
                .orElse(ResponseEntity.notFound().build());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private static TicketDto toDto(Ticket ticket) {
        List<String> attachments = new ArrayList<>();
        if (ticket.getAttachment1() != null && !ticket.getAttachment1().isBlank()) {
            attachments.add(ticket.getAttachment1());
        }
        if (ticket.getAttachment2() != null && !ticket.getAttachment2().isBlank()) {
            attachments.add(ticket.getAttachment2());
        }
        if (ticket.getAttachment3() != null && !ticket.getAttachment3().isBlank()) {
            attachments.add(ticket.getAttachment3());
        }

        return new TicketDto(
                ticket.getId(),
                ticket.getResource(),
                ticket.getLocation(),
                ticket.getCategory(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getContactDetails(),
                attachments,
                ticket.getStatus(),
                ticket.getUser().getName(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt());
    }

    private static List<String> sanitizeAttachments(List<String> attachments) {
        if (attachments == null) {
            return List.of();
        }
        if (attachments.size() > 3) {
            throw new IllegalArgumentException("Maximum 3 attachments allowed");
        }

        List<String> cleaned = new ArrayList<>();
        for (String attachment : attachments) {
            if (attachment == null || attachment.isBlank()) {
                continue;
            }
            if (!attachment.startsWith("data:image/")) {
                throw new IllegalArgumentException("Only image attachments are allowed");
            }
            cleaned.add(attachment);
        }

        if (cleaned.size() > 3) {
            throw new IllegalArgumentException("Maximum 3 attachments allowed");
        }
        return cleaned;
    }

    public record StatusUpdateDto(String status) {}
}
