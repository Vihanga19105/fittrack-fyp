package com.fittrack.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    // ✅ Frontend sends email and password when user clicks Login
    private String email;
    private String password;
}