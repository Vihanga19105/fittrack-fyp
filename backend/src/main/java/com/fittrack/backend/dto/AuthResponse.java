package com.fittrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    // ✅ This is what backend sends back to frontend after successful login
    private String token;    // login key
    private String role;     // CLIENT or TRAINER or ADMIN
    private Long userId;     // user's ID number
    private String name;     // user's name
}