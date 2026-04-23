package com.example.demo.controller;

import com.example.demo.model.Ticket;
import com.example.demo.model.Ticket.Status;
import com.example.demo.model.User;
import com.example.demo.repository.TicketRepository;
import com.example.demo.repository.UserRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.CrossOrigin;
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
    public ResponseEntity<?> create(Authentication authentication, @RequestBody Ticket ticket) {
        User user = resolveUser(authentication);
        List<String> attachments = ticket.getImageAttachments();
        if (attachments != null && attachments.size() > 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "Maximum 3 image attachments are allowed."));
        }

        ticket.setId(null);
        ticket.setUserId(user.getId());
        ticket.setUserName(user.getName() == null || user.getName().isBlank() ? user.getEmail() : user.getName());
        ticket.setStatus(Status.OPEN);
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    @GetMapping
    public List<Ticket> list(Authentication authentication) {
        User user = resolveUser(authentication);
        if (isAdmin(authentication)) {
            return ticketRepository.findAll();
        }
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            Authentication authentication, @PathVariable String id, @RequestBody Map<String, String> payload) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        return ticketRepository
                .findById(id)
                .map(
                        ticket -> {
                            String nextStatus = payload.get("status");
                            if (nextStatus != null && !nextStatus.isBlank()) {
                                ticket.setStatus(Status.valueOf(nextStatus.trim().toUpperCase()));
                            }
                            if (payload.containsKey("assignedTech")) {
                                ticket.setAssignedTech(payload.get("assignedTech"));
                            }
                            if (payload.containsKey("resolutionNotes")) {
                                ticket.setResolutionNotes(payload.get("resolutionNotes"));
                            }
                            return ResponseEntity.ok(ticketRepository.save(ticket));
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    private static boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if ("ROLE_ADMIN".equals(authority.getAuthority()) || "ADMIN".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
