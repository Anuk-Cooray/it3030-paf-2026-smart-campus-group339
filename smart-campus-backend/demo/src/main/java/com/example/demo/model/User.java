package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String name;

    private String mobileNumber;

    /** Base64 data URL or raw base64 image payload stored as plain text in MongoDB. */
    private String profilePicture;

    private String role;

    /** BCrypt hash; null until the user sets a local password (e.g. after Google onboarding). */
    @JsonIgnore
    private String password;

    /** Campus login id (e.g. IT23328020); optional until linked. */
    @Indexed(unique = true, sparse = true)
    private String studentId;

    /** e.g. GOOGLE, GOOGLE_AND_LOCAL — null for legacy rows created before this column existed. */
    private String authProvider;
}
