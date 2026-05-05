package com.fittrack.backend.dto;

import com.fittrack.backend.model.Role;
import lombok.Data;

@Data
public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private Role role;
}