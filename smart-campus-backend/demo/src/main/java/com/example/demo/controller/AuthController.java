package com.example.demo.controller;

import com.example.demo.dto.AuthResponseDto;
import com.example.demo.dto.LoginDto;
import com.example.demo.dto.ProfileSetupDto;
import com.example.demo.dto.TokenDto;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    private static final String CLIENT_ID = "291429509751-oofn0bvctjl4c343kc3vudi7gtq5isep.apps.googleusercontent.com";

    public AuthController(UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping(value = "/google", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponseDto> authenticateGoogleUser(@RequestBody TokenDto tokenDto) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
                    new GsonFactory())
                    .setAudience(Collections.singletonList(CLIENT_ID))
                    .build();

            GoogleIdToken idToken = verifier.verify(tokenDto.getToken());

            if (idToken == null) {
                return ResponseEntity.status(401).build();
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
            } else {
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setRole("ROLE_USER");
                user.setAuthProvider("GOOGLE");
                userRepository.save(user);
            }

            String token = jwtService.issueToken(user);
            return ResponseEntity.ok(toAuthResponse(user, token));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Links a Google-only account to a campus Student ID and a local password.
     * Requires a valid JWT from Google
     * sign-in (email is taken from the token, never from the request body).
     */
    @PostMapping(value = "/complete-profile", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> completeProfile(Authentication authentication, @RequestBody ProfileSetupDto dto) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        if (!"GOOGLE".equals(user.getAuthProvider())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error",
                            "Profile setup is only for Google accounts that have not linked local credentials yet."));
        }
        if (!needsProfileSetup(user)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Profile is already complete."));
        }

        String studentId = dto.studentId() == null ? "" : dto.studentId().trim();
        String rawPassword = dto.password() == null ? "" : dto.password();
        if (studentId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student ID is required."));
        }
        if (rawPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters."));
        }

        if (userRepository.findByStudentId(studentId).filter(u -> !u.getId().equals(user.getId())).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "That Student ID is already in use."));
        }

        user.setStudentId(studentId);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setAuthProvider("GOOGLE_AND_LOCAL");
        userRepository.save(user);

        try {
            String token = jwtService.issueToken(user);
            return ResponseEntity.ok(toAuthResponse(user, token));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not issue token"));
        }
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> standardLogin(@RequestBody LoginDto loginDto) {
        String identifier = loginDto.studentId() == null ? "" : loginDto.studentId().trim();
        if (identifier.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student ID or email is required."));
        }

        // If the identifier looks like an email, look up by email (admin login path)
        Optional<User> userOpt = identifier.contains("@")
                ? userRepository.findByEmail(identifier)
                : userRepository.findByStudentId(identifier);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        String hash = user.getPassword();
        if (hash == null || hash.isBlank()) {
            if ("GOOGLE".equals(user.getAuthProvider())) {
                return ResponseEntity.status(401).body(
                        Map.of("error", "This account uses Google Sign-In. Use Google login or complete profile setup."));
            }
            return ResponseEntity.status(401).body(Map.of("error", "Password is not set for this account"));
        }

        String candidate = loginDto.password() == null ? "" : loginDto.password();
        if (!passwordEncoder.matches(candidate, hash)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        try {
            String token = jwtService.issueToken(user);
            return ResponseEntity.ok(toAuthResponse(user, token));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not issue token"));
        }
    }

    private AuthResponseDto toAuthResponse(User user, String token) {
        return new AuthResponseDto(
                token,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getStudentId(),
                needsProfileSetup(user));
    }

    private static boolean needsProfileSetup(User user) {
        return "GOOGLE".equals(user.getAuthProvider())
                && (isBlank(user.getStudentId()) || isBlank(user.getPassword()));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
