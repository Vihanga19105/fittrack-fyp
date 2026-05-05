package com.fittrack.backend.repository;

import com.fittrack.backend.model.ClientProfile;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClientProfileRepository
        extends JpaRepository<ClientProfile, Long> {

    // ✅ Find client profile by user
    Optional<ClientProfile> findByUser(User user);
}