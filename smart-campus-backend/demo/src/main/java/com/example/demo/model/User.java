package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    @Column(name = "mobile_number")
    private String mobileNumber;

    /** Base64 data URL or raw base64 image payload. */
    @Column(columnDefinition = "LONGTEXT")
    private String profilePicture;

    @Column(nullable = false)
    private String role;

    /**
     * BCrypt hash; null until the user sets a local password (e.g. after Google
     * onboarding).
     */
    @JsonIgnore
    @Column(name = "password_hash")
    private String password;

    /** Campus login id (e.g. IT23328020); optional until linked. */
    @Column(name = "student_id", unique = true)
    private String studentId;

    /**
     * e.g. GOOGLE, GOOGLE_AND_LOCAL — null for legacy rows created before this
     * column existed.
     */
    @Column(name = "auth_provider")
    private String authProvider;
}
