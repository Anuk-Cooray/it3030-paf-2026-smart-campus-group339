package com.example.demo.config;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@campus.lk").isPresent()) {
            return;
        }

        User admin = new User();
        admin.setEmail("admin@campus.lk");
        admin.setName("Campus Admin");
        admin.setRole("ROLE_ADMIN");
        admin.setPassword(passwordEncoder.encode("12121212"));
        admin.setAuthProvider("LOCAL");
        admin.setStudentId("ADMIN001");
        userRepository.save(admin);
    }
}
