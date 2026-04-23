package com.example.demo.dto;

/**
 * Partial profile update: {@code null} means "leave unchanged". Empty
 * {@code profilePicture} clears the photo.
 */
public record ProfileUpdateDto(String name, String mobileNumber, String password, String profilePicture) {
}
