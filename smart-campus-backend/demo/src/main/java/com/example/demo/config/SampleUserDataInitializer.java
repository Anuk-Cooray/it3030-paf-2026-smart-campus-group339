package com.example.demo.config;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SampleUserDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleUserDataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SampleUserDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        ensureUser(
                "admin@sliit.lk",
                "Campus Admin",
                "ROLE_ADMIN",
                "ITADMIN01",
                "Admin@123");

        ensureUser(
                "user1@sliit.lk",
                "Sample User One",
                "ROLE_USER",
                "ITUSER001",
                "User@1234");

        ensureUser(
                "user2@sliit.lk",
                "Sample User Two",
                "ROLE_USER",
                "ITUSER002",
                "User@1234");


                
    // MY ACCOUNT - ADD 
    ensureUser(
            "it23322462@my.sliit.lk",
            "Dileshani",
            "ROLE_USER",
            "IT23322462",
            "Dileshani2001");
    }

    private void ensureUser(String email, String name, String role, String studentId, String rawPassword) {
        if (userRepository.findByStudentId(studentId).isPresent()) {
            return;
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setRole(role);
        user.setStudentId(studentId);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setAuthProvider("GOOGLE_AND_LOCAL");

        userRepository.save(user);
        log.info("Seeded sample login user {} ({})", studentId, role);
    }
}
