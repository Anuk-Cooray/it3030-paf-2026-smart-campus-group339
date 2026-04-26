package com.example.demo.controller;

import com.example.demo.model.Comment;
import com.example.demo.model.User;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.UserRepository;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class CommentController {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public CommentController(CommentRepository commentRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/api/tickets/{ticketId}/comments")
    public ResponseEntity<?> addComment(
            Authentication authentication, @PathVariable Long ticketId, @RequestBody Map<String, String> payload) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String text = payload == null ? null : payload.get("text");
        if (text == null) {
            text = payload == null ? null : payload.get("message");
        }
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Comment text is required."));
        }

        Comment comment = new Comment();
        comment.setTicketId(ticketId);
        comment.setUserId(user.getId());
        comment.setUserName(user.getName() == null || user.getName().isBlank() ? user.getEmail() : user.getName());
        comment.setText(text.trim());
        return ResponseEntity.ok(commentRepository.save(comment));
    }

    @GetMapping("/api/tickets/{ticketId}/comments")
    public ResponseEntity<?> listComments(Authentication authentication, @PathVariable Long ticketId) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<?> deleteComment(Authentication authentication, @PathVariable Long commentId) {
        User user = resolveUser(authentication);
        return commentRepository
                .findById(commentId)
                .map(
                        comment -> {
                            boolean owner = user.getId().equals(comment.getUserId());
                            boolean admin = isAdmin(authentication);
                            if (!owner && !admin) {
                                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
                            }
                            commentRepository.delete(comment);
                            return ResponseEntity.noContent().build();
                        })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository
                .findByEmail(authentication.getName())
                .orElse(null);
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
