package com.fittrack.backend.repository;

import com.fittrack.backend.model.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VerificationTokenRepository
        extends JpaRepository<VerificationToken, Long> {

    // ✅ Find token by its string value
    Optional<VerificationToken> findByToken(String token);
}


