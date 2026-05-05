package com.fittrack.backend.repository;

import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ Check if email already exists (used in register)
    boolean existsByEmail(String email);

    // ✅ Find user by email (used in login)
    Optional<User> findByEmail(String email);
}