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
        User admin = userRepository.findByEmail("admin@campus.lk").orElseGet(User::new);
        admin.setEmail("admin@campus.lk");
        admin.setName("Campus Admin");
        admin.setRole("ROLE_ADMIN");
        admin.setStudentId("ADMIN001");
        admin.setAuthProvider("LOCAL");
        admin.setPassword(passwordEncoder.encode("12121212"));
        userRepository.save(admin);
    }
}
